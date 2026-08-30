# 🚀 AWS EC2 Deployment Guide

## Complete Step-by-Step Guide to Deploy Task Manager on AWS EC2

### Prerequisites
- AWS Account with free tier access
- Basic SSH knowledge
- Git installed locally
- Docker & Docker Compose installed locally (for testing)

---

## Step 1: Launch EC2 Instance

### 1.1 Open AWS Console
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Log in to your account
3. Navigate to **EC2 Dashboard**

### 1.2 Launch Instance
1. Click **"Launch Instances"**
2. Name your instance: `task-manager-server`
3. Choose AMI: **Amazon Linux 2** or **Ubuntu 22.04 LTS** (free tier eligible)
4. Instance Type: **t2.micro** (free tier)
5. Key Pair: 
   - Create new or select existing
   - Download `.pem` file (keep it safe!)
6. Storage: **30 GB** (free tier includes up to 30GB)
7. Click **"Launch Instance"**

### 1.3 Get Instance Details
Once running:
- Note **Public IPv4 address** (e.g., `54.123.45.67`)
- Note **Instance ID**
- Note **Key Pair file name**

---

## Step 2: Configure Security Group

### 2.1 Modify Security Group Rules
1. Click on your instance
2. Go to **Security** tab
3. Click on **Security group**
4. Click **Edit inbound rules**

### 2.2 Add Inbound Rules
Add these rules (allows traffic on necessary ports):

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|----------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Frontend (optional) |
| HTTP | TCP | 3000 | 0.0.0.0/0 | Frontend (React) |
| HTTP | TCP | 5000 | 0.0.0.0/0 | Backend API |

**⚠️ Security Note**: For production, restrict source IPs instead of `0.0.0.0/0`

---

## Step 3: Connect to EC2 Instance

### 3.1 Set Key Permissions (Local Machine)
```bash
# Make key file readable only by you
chmod 400 /path/to/your-key.pem
```

### 3.2 SSH into Instance
```bash
# For Amazon Linux 2
ssh -i /path/to/your-key.pem ec2-user@YOUR_PUBLIC_IP

# For Ubuntu
ssh -i /path/to/your-key.pem ubuntu@YOUR_PUBLIC_IP

# Example:
ssh -i ~/Downloads/task-manager-key.pem ec2-user@54.123.45.67
```

✅ You should now be connected to your EC2 instance!

---

## Step 4: Install Docker and Docker Compose

### 4.1 Update System
```bash
sudo yum update -y
# OR for Ubuntu:
# sudo apt-get update -y
```

### 4.2 Install Docker (Amazon Linux 2)
```bash
# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker

# Enable Docker on boot
sudo systemctl enable docker

# Add ec2-user to docker group (run Docker without sudo)
sudo usermod -aG docker ec2-user

# Verify Docker
docker --version
```

### 4.2 Install Docker (Ubuntu)
```bash
# Install Docker
sudo apt-get install docker.io -y

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Verify
docker --version
```

### 4.3 Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### 4.4 Restart to Apply Group Changes
```bash
exit  # Exit SSH connection

# Reconnect after a few seconds
ssh -i /path/to/your-key.pem ec2-user@YOUR_PUBLIC_IP
```

---

## Step 5: Clone Repository

### 5.1 Install Git
```bash
sudo yum install git -y
# OR for Ubuntu:
# sudo apt-get install git -y
```

### 5.2 Clone Your Repository
```bash
# Clone the repository
git clone https://github.com/aartipinjan/devops-task-manager.git

# Navigate to project
cd devops-task-manager

# Verify files are there
ls -la
```

Expected output:
```
README.md
backend/
frontend/
docker-compose.yml
setup.sh
```

---

## Step 6: Build and Start Services

### 6.1 Build Docker Images
```bash
# Navigate to project directory
cd devops-task-manager

# Build all images (this takes ~5-10 minutes)
docker-compose build
```

**Expected output**:
```
Building backend ... done
Building frontend ... done
```

### 6.2 Start Services
```bash
# Start all services in background
docker-compose up -d
```

**Expected output**:
```
Creating network "devops-task-manager_app-network" with driver "bridge"
Creating task-manager-db ... done
Creating task-manager-backend ... done
Creating task-manager-frontend ... done
```

### 6.3 Wait for Services to Be Healthy
```bash
# Check status (wait ~30 seconds for database)
sleep 30

# Verify all services are healthy
docker-compose ps
```

**Expected output**:
```
NAME                    COMMAND              STATUS              PORTS
task-manager-frontend   "nginx -g daemon..." Up (healthy)        0.0.0.0:3000->80/tcp
task-manager-backend    "node server.js"     Up (healthy)        0.0.0.0:5000->5000/tcp
task-manager-db         "docker-entrypoin..." Up (healthy)        5432/tcp
```

---

## Step 7: Verify Application

### 7.1 Test Backend Health
```bash
# Check backend health endpoint
curl http://localhost:5000/health
```

**Expected response**:
```json
{"status":"healthy","timestamp":"2026-08-30T08:15:30.123Z"}
```

### 7.2 Test Backend API
```bash
# Get all tasks
curl http://localhost:5000/api/tasks
```

**Expected response**:
```json
{"success":true,"data":[],"count":0}
```

### 7.3 Test Frontend (Browser)
Open browser and go to:
```
http://YOUR_PUBLIC_IP:3000
```

✅ You should see the Task Manager UI!

---

## Step 8: Create Sample Task

### 8.1 Via API
```bash
# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Task","description":"Testing the app","status":"pending"}'
```

### 8.2 Via Web UI
1. Go to http://YOUR_PUBLIC_IP:3000
2. Enter task title in the form
3. Click "Add Task"
4. Task should appear in the list

---

## Step 9: Test Data Persistence

### 9.1 Verify Task Exists
```bash
# Get all tasks
curl http://localhost:5000/api/tasks

# Should show the task you created
```

### 9.2 Stop Containers (Keep Data)
```bash
# Stop containers (data persists in volume)
docker-compose stop
```

### 9.3 Restart Containers
```bash
# Start containers again
docker-compose start

# Wait 10 seconds
sleep 10
```

### 9.4 Verify Data Persisted
```bash
# Get all tasks
curl http://localhost:5000/api/tasks

# ✅ Task should still exist!
```

---

## Step 10: View Logs

### 10.1 View All Logs
```bash
# Follow logs from all services
docker-compose logs -f

# Stop following: Ctrl+C
```

### 10.2 View Specific Service Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f db
```

---

## Step 11: Access Database

### 11.1 Connect to PostgreSQL
```bash
# Enter PostgreSQL shell
docker-compose exec db psql -U postgres -d taskdb
```

### 11.2 Execute SQL Queries
```sql
-- Inside psql shell:

-- View all tables
\dt

-- View tasks table
SELECT * FROM tasks;

-- View table structure
\d tasks

-- Exit
\q
```

---

## Troubleshooting

### Issue: Cannot connect to EC2
```bash
# Verify instance is running
# Check security group allows SSH (port 22)
# Verify key file has correct permissions:
chmod 400 your-key.pem
```

### Issue: Port already in use
```bash
# Check what's using the port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or modify docker-compose.yml port mapping
```

### Issue: Docker daemon not running
```bash
# Restart Docker
sudo systemctl restart docker

# Verify
sudo systemctl status docker
```

### Issue: Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a
```

### Issue: Backend connection refused
```bash
# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

---

## Stop and Cleanup (When Done)

### Keep Data (Stop only)
```bash
# Stop containers (volume persists)
docker-compose stop

# Start again later
docker-compose start
```

### Remove Everything
```bash
# Stop and remove containers and volumes
docker-compose down -v

# Remove all Docker resources
docker system prune -a
```

### Terminate EC2 Instance (Free Up Credits)
1. Go to AWS Console
2. Right-click instance
3. Click **"Terminate Instance"**
4. Confirm termination

---

## Cost Estimation (AWS Free Tier)

| Service | Free Tier | Monthly Cost |
|---------|-----------|---------------|
| EC2 (t2.micro) | 750 hours | Free |
| EBS Storage (30GB) | 30GB | Free |
| Data Transfer (out) | 15GB | Free |
| Total | - | **FREE** |

⚠️ **Keep within free tier limits**:
- Don't run instance 24/7 (750 hours ≈ 31 days)
- Stop instance when not in use
- Monitor AWS Billing Dashboard

---

## Summary Commands

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@YOUR_IP

# Clone repo
git clone https://github.com/aartipinjan/devops-task-manager.git
cd devops-task-manager

# Build and start
docker-compose build
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test API
curl http://localhost:5000/health

# Access UI
# Open browser: http://YOUR_PUBLIC_IP:3000

# Stop
docker-compose stop
```

---

## Next Steps

- 📝 Create system architecture diagram (for exam submission)
- 📸 Take screenshots of every step (for documentation)
- 📋 Create PDF with ordered screenshots
- 🔗 Create LinkedIn post with repo link and learnings
- ⭐ Star the GitHub repo

---

**Deployment Complete! 🎉**

Your Task Manager is now running on AWS EC2!
