# System Architecture Diagram

## Overview

This document describes the system architecture of the Task Manager application.

```
╔════════════════════════════════════════════════════════════════════════════╗
║                          INTERNET / USER BROWSER                            ║
║                                   |                                        ║
║                                   |                                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║                     AWS EC2 Instance (t2.micro)                            ║
║                      IP: 54.XXX.XXX.XXX                                    ║
║                                                                             ║
║  ┌───────────────────────────────────��───────────────────────────────┐   ║
║  │                  Docker Host (Linux Container)                    │   ║
║  │                                                                   │   ║
║  │  ┌─────────────────────────────────────────────────────────────┐ │   ║
║  │  │     Custom Docker Network: app-network (bridge)            │ │   ║
║  │  │                                                             │ │   ║
║  │  │  ┌──────────────────────┐    ┌──────────────────────────┐ │ │   ║
║  │  │  │  Frontend Container  │    │  Backend Container       │ │ │   ║
║  │  │  │  (Nginx + React)     │    │  (Node.js + Express)     │ │ │   ║
║  │  │  │                      │───▶│                          │ │ │   ║
║  │  │  │  Port: 3000 (HTTP)   │    │  Port: 5000 (HTTP)       │ │ │   ║
║  │  │  │  ✓ Non-root user     │    │  ✓ Non-root user        │ │ │   ║
║  │  │  ���  ✓ Health check      │    │  ✓ Health check         │ │ │   ║
║  │  │  │  ✓ Gzip compression  │    │  ✓ Multi-stage build    │ │ │   ║
║  │  │  │                      │    │  ✓ npm ci                │ │ │   ║
║  │  │  └──────────────────────┘    └──────────────────────────┘ │ │   ║
║  │  │           ▲                             │                  │ │   ║
║  │  │           │                             ▼                  │ │   ║
║  │  │     [Port Mapping]              ┌──────────────────────┐  │ │   ║
║  │  │    Host:3000 → Cont:80         │  Database Container  │  │ │   ║
║  │  │    Host:5000 → Cont:5000       │  (PostgreSQL 15)     │  │ │   ║
║  │  │                                 │                      │  │ │   ║
║  │  │                                 │  Port: 5432 (Int)    │  │ │   ║
║  │  │                                 │  ✓ Health check      │  │ │   ║
║  │  │                                 │  ✓ Persistent vol    │  │ │   ║
║  │  │                                 │                      │  │ │   ║
║  │  │                                 └──────────────────────┘  │ │   ║
║  │  │                                                             │ │   ║
║  │  │  ┌─────────────────────────────────────────────────────┐  │ │   ║
║  │  │  │            Persistent Volume (db_data)            │  │ │   ║
║  │  │  │         /var/lib/postgresql/data                  │  │ │   ║
║  │  │  │    Data survives container restart                │  │ │   ║
║  │  │  └─────────────────────────────────────────────────────┘  │ │   ║
║  │  │                                                             │ │   ║
║  │  └─────────────────────────────────────────────────────────────┘ │   ║
║  │                                                                   │   ║
║  │  Dependencies & Health Checks:                                  │   ║
║  │  • Frontend depends on Backend                                  │   ║
║  │  • Backend depends on Database (waits for healthy status)       │   ║
║  │  • All services restart automatically if they crash             │   ║
║  │                                                                   │   ║
║  └───────────────────────────────────────────────────────────────────┘   ║
║                                                                             ║
║  Security Features:                                                        ║
║  ✓ All containers run as non-root users                                   ║
║  ✓ Database port (5432) not exposed to host                               ║
║  ✓ Only frontend (3000) and backend (5000) exposed                        ║
║  ✓ Services communicate via secure internal network                       ║
║  ✓ Environment variables for configuration                                ║
║                                                                             ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## Data Flow

### User Access Flow
1. **User opens browser** → `http://54.XXX.XXX.XXX:3000`
2. **Browser requests React app** → Nginx serves static files from `/usr/share/nginx/html`
3. **React app loads** → Initializes, fetches tasks from API
4. **React calls backend API** → `http://backend:5000/api/tasks` (service name resolution)
5. **Backend processes request** → Connects to database via service name `db`
6. **Database returns data** → Backend sends JSON response
7. **React renders UI** → Displays tasks in browser

### Task Creation Flow
```
User Input (Browser)
    ↓
React Component Handler
    ↓
Axios POST to http://backend:5000/api/tasks
    ↓
Express Route Handler (backend/server.js)
    ↓
Validate Input
    ↓
PostgreSQL INSERT Query
    ↓
Database inserts row into `tasks` table
    ↓
Returns inserted row
    ↓
Backend sends JSON response
    ↓
React updates state and re-renders
    ↓
UI shows new task
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Server**: Nginx 1.24 (Alpine)
- **Port**: 3000 (exposed)
- **Features**: SPA routing, Gzip compression, caching
- **Image Size**: ~100MB

### Backend
- **Runtime**: Node.js 18 (Alpine)
- **Framework**: Express.js 4.18
- **Port**: 5000 (exposed)
- **Database Driver**: pg (PostgreSQL client)
- **Image Size**: ~220MB

### Database
- **System**: PostgreSQL 15 (Alpine)
- **Port**: 5432 (internal only)
- **Storage**: Named volume `db_data`
- **Image Size**: ~71MB

### Orchestration
- **Container Runtime**: Docker 20.10+
- **Orchestration**: Docker Compose 2.0+
- **Network**: Custom bridge network for DNS service discovery

## Deployment Architecture

### Multi-Stage Build Benefits

**Backend (Node.js)**
- Stage 1: Installs all dependencies including dev tools
- Stage 2: Copies only production dependencies
- **Result**: Excludes build tools, reducing image size from 940MB → 220MB

**Frontend (React)**
- Stage 1: Builds React app with Node.js (includes dev tools)
- Stage 2: Copies built artifacts to Nginx (no Node.js needed)
- **Result**: Lightweight runtime, reducing image size from 500MB → 100MB

### Container Optimization

**Non-root Users**
```
Backend: nodejs (UID 1001)
Frontend (Nginx): nginx (UID 101)
```
- Prevents privilege escalation attacks
- Security best practice
- Required for production environments

**Health Checks**
```
Backend: HTTP GET /health (30s interval, 5s timeout)
Frontend: HTTP GET / (30s interval, 5s timeout)
Database: pg_isready (10s interval, 5s timeout)
```
- Orchestrators detect unhealthy containers
- Auto-restart if health check fails
- Improves reliability and uptime

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes (Implicit)
- `id` → Primary key index (auto-created)
- Sorting by `created_at DESC` (could add index for optimization)

## Networking

### Docker Network: app-network
- **Type**: Bridge network
- **Driver**: bridge
- **DNS**: Built-in service discovery

### Service Resolution
- Frontend → Backend: `http://backend:5000`
- Backend → Database: `postgresql://db:5432`
- Docker DNS resolves service names to container IPs
- No need for hardcoded IPs

### Port Mapping
```
Host Port : Container Port : Protocol
3000      : 80             : HTTP (Frontend)
5000      : 5000           : HTTP (Backend)
5432      : Not mapped     : PostgreSQL (Internal only)
```

## Persistence

### Named Volume: db_data
- **Location**: `/var/lib/postgresql/data` (inside container)
- **Host Location**: Docker managed (usually `/var/lib/docker/volumes/...`)
- **Persistence**: Survives container stop/restart/removal
- **Data Lifecycle**: Exists until explicitly deleted with `docker volume rm`

### Volume Lifecycle
```
First Run: Docker creates volume
↓
Container writes data to volume
↓
docker-compose stop: Container stops, volume remains
↓
docker-compose start: Container restarts, volume remounted
↓
Data is still there! ✅
```

## Scalability Considerations

### Current Architecture (Single Container)
- Single instance of each service
- Suitable for demo/learning
- Good for small production deployments

### Future Scaling (Kubernetes)
- Multiple backend replicas
- Load balancer (Ingress)
- Database replication (PostgreSQL with streaming replication)
- Persistent storage (PVC - Persistent Volume Claims)

## Security Considerations

### ✅ Implemented
- Non-root container users
- Internal-only database access
- Health checks
- Environment variable configuration
- Multi-stage builds (no dev tools in prod)

### ⚠️ Missing (For Production)
- SSL/TLS encryption
- Database authentication (hardcoded password in compose)
- API rate limiting
- Input validation/sanitization
- Secrets management (use Docker Secrets or Vault)
- Backup strategy
- Monitoring and logging
- Network policies

### Production Recommendations
1. Use `.env` file with secrets (not in docker-compose.yml)
2. Implement TLS/SSL with reverse proxy (nginx/traefik)
3. Add API authentication (JWT)
4. Database backups (automated)
5. Monitoring (Prometheus + Grafana)
6. Logging (ELK stack or similar)
7. Rate limiting on API endpoints
8. Input validation with libraries

## Performance Optimization

### Frontend (Nginx)
- **Gzip Compression**: ~70% file size reduction
- **Browser Caching**: 1-year cache for static assets
- **Minified Assets**: React build includes minification
- **CDN Ready**: Can serve from CloudFront

### Backend (Node.js)
- **Multi-stage Build**: Excludes dev dependencies
- **npm ci**: Faster, deterministic installs
- **Connection Pooling**: PostgreSQL pool for connection reuse
- **Error Handling**: Graceful error responses

### Database (PostgreSQL)
- **Indexing**: Primary key indexed (could add more)
- **Connection Pooling**: Reduces connection overhead
- **Persistence**: Named volume for data durability

## Monitoring Points

### Health Check Endpoints
- `GET /health` (Backend) - Returns JSON with status
- `GET /` (Frontend) - Returns HTML
- `pg_isready` (Database) - PostgreSQL health probe

### Metrics to Monitor
- Container CPU usage
- Container memory usage
- Disk space (for database volume)
- API response times
- Task count in database
- Error rates

### Logging
- Docker logs: `docker-compose logs -f`
- Backend logs: Application console output
- Database logs: PostgreSQL server logs
- Frontend logs: Browser console (F12)

---

**Last Updated**: August 30, 2026  
**Version**: 1.0.0
