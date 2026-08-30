# 📋 Task Manager - DevOps Full-Stack Application

> A production-ready 3-tier web application demonstrating DevOps best practices with Docker, Docker Compose, and PostgreSQL.

## 📌 Overview

This project is a complete full-stack application showcasing:
- ✅ **Frontend**: React 18 with modern UI (Nginx-based)
- ✅ **Backend**: Node.js + Express REST API
- ✅ **Database**: PostgreSQL with persistent storage
- ✅ **Containerization**: Docker multi-stage builds
- ✅ **Orchestration**: Docker Compose with networking
- ✅ **DevOps**: Health checks, non-root users, optimized images

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host (EC2)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Custom Docker Network: app-network          │  │
│  │                                                      │  │
│  │  ┌──────────────────┐    ┌──────────────────┐      │  │
│  │  │   Frontend       │    │   Backend API    │      │  │
│  │  │  (React+Nginx)   │───▶│  (Node+Express)  │      │  │
│  │  │  Port: 3000      │    │  Port: 5000      │      │  │
│  │  │  (Exposed)       │    │  (Exposed)       │      │  │
│  │  └──────────────────┘    └──────────────────┘      │  │
│  │           │                     │                   │  │
│  │           └─────────────────────┤                   │  │
│  │                                 ▼                   │  │
│  │                    ┌──────────────────────┐         │  │
│  │                    │   PostgreSQL DB      │         │  │
│  │                    │   Port: 5432         │         │  │
│  │                    │   (Internal Only)    │         │  │
│  │                    │   Persistent Volume  │         │  │
│  │                    └──────────────────────┘         │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Services Communication:
  - Frontend → Backend: HTTP REST API (service name: backend)
  - Backend → Database: PostgreSQL protocol (service name: db)
  - Network Type: Custom bridge (DNS-based service discovery)
```

---

## 🚀 Quick Start

### Prerequisites
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git
- 2GB RAM minimum
- Linux, macOS, or Windows with WSL2

### Local Development

```bash
# Clone repository
git clone https://github.com/aartipinjan/devops-task-manager.git
cd devops-task-manager

# Build and start all services
docker-compose up --build

# Wait for all services to be healthy (check logs)
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5432 (internal only)
```

### Stop Services

```bash
# Stop without removing volumes (data persists)
docker-compose stop

# Start again
docker-compose start

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

---

## 📦 Dockerfile Optimization Choices

### Backend Dockerfile (Node.js Express)

**File**: `backend/Dockerfile`

**Optimization Techniques:**

1. **Multi-Stage Build**
   - Stage 1 (Builder): Installs dependencies
   - Stage 2 (Runtime): Only copies production dependencies
   - **Benefit**: Reduces image size by excluding build tools

2. **Base Image: node:18-alpine**
   - Alpine Linux: ~168MB (vs ~940MB with node:18-slim)
   - **Benefit**: Minimal OS footprint

3. **npm ci instead of npm install**
   - `npm ci` = clean install with exact versions
   - **Benefit**: Faster, more reliable, reproducible builds

4. **Non-root User**
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
   USER nodejs
   ```
   - **Benefit**: Security best practice, prevents privilege escalation

5. **Health Check**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --retries=3
   ```
   - **Benefit**: Orchestrators (Docker/K8s) can monitor container health

**Final Image Size**: ~220MB

### Frontend Dockerfile (React + Nginx)

**File**: `frontend/Dockerfile`

**Optimization Techniques:**

1. **Multi-Stage Build**
   - Stage 1 (Builder): Compiles React app with Node.js
   - Stage 2 (Runtime): Serves with lightweight Nginx
   - **Benefit**: Excludes Node.js and dev dependencies from final image

2. **Base Images**
   - Builder: node:18-alpine (~168MB)
   - Runtime: nginx:1.24-alpine (~41MB)
   - **Benefit**: Nginx is optimized for serving static files

3. **React Build Optimization**
   ```dockerfile
   RUN npm run build  # Creates optimized /app/build directory
   ```
   - **Benefit**: Production-ready minified JavaScript/CSS

4. **Non-root User (Nginx)**
   ```dockerfile
   RUN addgroup -g 101 -S nginx && adduser -S -D -H -u 101...
   USER nginx
   ```
   - **Benefit**: Security best practice

5. **Nginx Configuration** (`frontend/nginx.conf`)
   - Gzip compression: Reduces file sizes by ~70%
   - Cache headers: Leverages browser caching
   - SPA routing: Serves index.html for all non-static routes

6. **Health Check**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --retries=3
   ```

**Final Image Size**: ~100MB

---

## 🔌 Docker Compose Configuration

**File**: `docker-compose.yml`

### Key Features

#### 1. **Custom Docker Network**
```yaml
networks:
  app-network:
    driver: bridge
```
- Services communicate by name (DNS resolution)
- Frontend accesses backend via `http://backend:5000`
- More secure than hardcoded IPs

#### 2. **Service Dependencies**
```yaml
depends_on:
  db:
    condition: service_healthy  # Wait for health check
```
- Backend waits for database to be healthy
- Frontend waits for backend
- Prevents connection errors

#### 3. **Port Mapping**
```yaml
ports:
  - "3000:80"   # Frontend: localhost:3000 → container:80
  - "5000:5000" # Backend: localhost:5000 → container:5000
  # Database: No port mapping (internal only)
```

#### 4. **Persistent Volume**
```yaml
volumes:
  db_data:
    driver: local

services:
  db:
    volumes:
      - db_data:/var/lib/postgresql/data  # Named volume
```
- Database data persists across container restarts
- Data survives: `docker-compose stop/start`

#### 5. **Environment Variables**
```yaml
environment:
  DB_HOST: db         # Service name (Docker DNS resolves this)
  DB_PORT: 5432
  DB_NAME: taskdb
  REACT_APP_API_URL: http://backend:5000  # Frontend config
```

#### 6. **Restart Policy**
```yaml
restart: unless-stopped
```
- Auto-restart if container crashes
- Except if explicitly stopped

---

## 📊 Image Size Comparison

| Component | Base Image | Final Size | Optimization |
|-----------|-----------|-----------|---------------|
| **Backend** | node:18-alpine | ~220MB | Multi-stage, npm ci, non-root |
| **Frontend** | nginx:1.24-alpine | ~100MB | Multi-stage, Gzip, minified |
| **Database** | postgres:15-alpine | ~71MB | Native |
| **Total** | - | ~391MB | Multi-container efficiency |

---

## 🔒 Security Best Practices

✅ **Non-root Users**
- Backend runs as `nodejs` user (UID 1001)
- Frontend (Nginx) runs as `nginx` user (UID 101)
- Prevents privilege escalation attacks

✅ **Health Checks**
- Backend: HTTP GET `/health` endpoint
- Frontend: HTTP GET `/` endpoint
- Database: PostgreSQL `pg_isready` command
- Helps orchestrators detect and recover from failures

✅ **Network Isolation**
- Database port (5432) not exposed
- Only frontend (3000) and backend (5000) accessible
- Services communicate via secure internal network

✅ **Environment Variables**
- Sensitive data (DB password) in compose file (dev only)
- For production: Use secrets management (Docker Secrets, Vault)

---

## 🧪 Testing

### 1. Check Container Status
```bash
docker-compose ps
```
Expected output:
```
NAME                    STATUS
task-manager-frontend   Up (healthy)
task-manager-backend    Up (healthy)
task-manager-db         Up (healthy)
```

### 2. Test Frontend
```bash
curl http://localhost:3000
# Should return HTML content
```

### 3. Test Backend API
```bash
# Health check
curl http://localhost:5000/health
# Response: {"status":"healthy",...}

# Get all tasks
curl http://localhost:5000/api/tasks
# Response: {"success":true,"data":[],"count":0}

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","description":"Task description","status":"pending"}'
```

### 4. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### 5. Access Database
```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d taskdb

# Inside psql:
SELECT * FROM tasks;  -- View all tasks
\dt                   -- List tables
\q                    -- Quit
```

---

## 💾 Data Persistence

### Verify Persistence

```bash
# 1. Start services
docker-compose up -d

# 2. Create a task via frontend/API
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","status":"pending"}'

# 3. Verify task exists
curl http://localhost:5000/api/tasks

# 4. Stop containers (data stays in volume)
docker-compose stop

# 5. Start again
docker-compose start

# 6. Task should still exist!
curl http://localhost:5000/api/tasks
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect devops-task-manager_db_data

# Remove unused volumes
docker volume prune
```

---

## 📝 API Endpoints

### Health Check
```
GET /health
Response: {"status":"healthy","timestamp":"..."}  (200 OK)
```

### Tasks - Read
```
GET /api/tasks
Response: {"success":true,"data":[...],"count":5}  (200 OK)

GET /api/tasks/:id
Response: {"success":true,"data":{id:1,...}}  (200 OK)
```

### Tasks - Create
```
POST /api/tasks
Body: {"title":"My Task","description":"...","status":"pending"}
Response: {"success":true,"data":{id:1,...}}  (201 Created)
```

### Tasks - Update
```
PUT /api/tasks/:id
Body: {"title":"Updated","description":"...","status":"completed"}
Response: {"success":true,"data":{...}}  (200 OK)
```

### Tasks - Delete
```
DELETE /api/tasks/:id
Response: {"success":true,"message":"Task deleted",...}  (200 OK)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
```bash
# Check if backend is running
docker-compose ps backend

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Issue: "Database connection refused"
```bash
# Ensure database is healthy
docker-compose ps db

# View database logs
docker-compose logs db

# Rebuild database
docker-compose down -v
docker-compose up --build
```

### Issue: "Port already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Stop and remove existing containers
docker-compose down

# Or use different ports (modify docker-compose.yml)
ports:
  - "8080:80"  # Change 3000 to 8080
```

### Issue: "Out of disk space"
```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
du -sh ~/.docker
```

---

## 📚 DevOps Learning Points

This project demonstrates:

1. ✅ **Multi-stage Docker builds** - Reduces image sizes
2. ✅ **Docker Compose orchestration** - Service coordination
3. ✅ **Health checks** - Container monitoring
4. ✅ **Networking** - Service discovery via DNS
5. ✅ **Persistent volumes** - Stateful data management
6. ✅ **Non-root users** - Security hardening
7. ✅ **Environment variables** - Configuration management
8. ✅ **Git workflow** - Meaningful commits
9. ✅ **Documentation** - Clear explanations

---

## 📈 Next Steps (For Production)

- ☐ Deploy to Kubernetes (instead of Docker Compose)
- ☐ Add Terraform for infrastructure as code (AWS/GCP/Azure)
- ☐ Implement CI/CD pipeline (GitHub Actions)
- ☐ Add monitoring (Prometheus + Grafana)
- ☐ Add logging (ELK stack or Loki)
- ☐ SSL/TLS certificates (Let's Encrypt)
- ☐ Database backups and replication
- ☐ Load balancing and auto-scaling

---

## 📄 License

MIT License - Feel free to use for learning and projects

---

## 👤 Author

**Aarti Pinjan**  
DevOps & Linux Systems Administrator  
[GitHub](https://github.com/aartipinjan) | [LinkedIn](https://linkedin.com/in/aartipinjan)

---

## 🙏 Acknowledgments

- Docker documentation and best practices
- React and Express.js communities
- PostgreSQL documentation
- DevOps best practices from industry standards

---

**Last Updated**: August 30, 2026  
**Version**: 1.0.0