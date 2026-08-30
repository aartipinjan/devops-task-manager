#!/bin/bash

# ============================================================================
# Task Manager - EC2 Setup Script (For Ubuntu/Amazon Linux 2)
# This script automates the entire setup process
# ============================================================================

set -e  # Exit on error

echo "🚀 Task Manager - EC2 Auto Setup"
echo "================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
  echo "⚠️  This script needs sudo privileges for some commands"
  echo "Run with: sudo bash ec2-setup.sh"
fi

echo "\n📦 Step 1: Update system packages..."
sudo yum update -y || sudo apt-get update -y

echo "\n🐳 Step 2: Install Docker..."
sudo yum install docker -y || sudo apt-get install docker.io -y

echo "\n▶️  Step 3: Start Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

echo "\n👤 Step 4: Add current user to docker group..."
sudo usermod -aG docker $USER

echo "\n📥 Step 5: Install Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "\n📂 Step 6: Clone repository..."
cd /home/$USER || cd ~
if [ ! -d "devops-task-manager" ]; then
  git clone https://github.com/aartipinjan/devops-task-manager.git
fi

cd devops-task-manager

echo "\n🔨 Step 7: Build Docker images..."
sudo docker-compose build

echo "\n🚀 Step 8: Start services..."
sudo docker-compose up -d

echo "\n⏳ Step 9: Waiting for services to be healthy..."
sleep 30

echo "\n✅ Service Status:"
sudo docker-compose ps

echo "\n🎉 Setup Complete!"
echo "\n📍 Access the application:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "   Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
echo "   Health Check: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000/health"
echo "\n📝 View logs:"
echo "   sudo docker-compose logs -f"
echo "\n🛑 Stop services:"
echo "   sudo docker-compose stop"
echo "\n📚 For more info, see README.md"
