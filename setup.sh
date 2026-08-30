#!/bin/bash

# ============================================================================
# Task Manager - Local Setup Script
# This script helps set up the project for local development
# ============================================================================

set -e  # Exit on error

echo "🚀 Task Manager - Local Setup"
echo "================================"

# Check prerequisites
echo "\n📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi
echo "✅ Docker found: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose found: $(docker-compose --version)"

# Build and start services
echo "\n🔨 Building Docker images..."
docker-compose build

echo "\n🚀 Starting services..."
docker-compose up -d

echo "\n⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "\n✅ Service Status:"
docker-compose ps

echo "\n🎉 Setup Complete!"
echo "\n📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo "\n📊 View logs:"
echo "   All: docker-compose logs -f"
echo "   Backend: docker-compose logs -f backend"
echo "\n🛑 Stop services:"
echo "   docker-compose stop"
echo "\n🧹 Clean up (remove data):"
echo "   docker-compose down -v"
echo "\n📚 For more info, see README.md"
