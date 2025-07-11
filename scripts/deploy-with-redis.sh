#!/bin/bash

# APACE Transportation Backend - Redis Deployment Script
# This script sets up the complete application with Redis caching

set -e

echo "🚀 Starting APACE Transportation Backend Deployment with Redis..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="development"
CLEAN_DEPLOY=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            ENVIRONMENT="production"
            PRODUCTION=true
            shift
            ;;
        --clean)
            CLEAN_DEPLOY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --prod, --production    Deploy in production mode"
            echo "  --clean                 Clean deployment (remove volumes)"
            echo "  --help                  Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Deploying in $ENVIRONMENT mode..."

# Clean deployment if requested
if [ "$CLEAN_DEPLOY" = true ]; then
    print_warning "Cleaning existing deployment..."
    if [ "$PRODUCTION" = true ]; then
        docker-compose -f docker-compose.prod.yml down -v
    else
        docker-compose down -v
    fi
    print_status "Cleanup completed"
fi

# Check if .env file exists for production
if [ "$PRODUCTION" = true ]; then
    if [ ! -f ".env.prod" ]; then
        print_warning ".env.prod file not found. Creating from example..."
        cp .env.example .env.prod
        print_warning "Please edit .env.prod with your production values before continuing."
        echo "Press Enter to continue after editing .env.prod..."
        read -r
    fi
fi

# Build and start services
print_status "Building and starting services..."

if [ "$PRODUCTION" = true ]; then
    print_status "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d --build
    COMPOSE_FILE="docker-compose.prod.yml"
else
    print_status "Starting development services..."
    docker-compose up -d --build
    COMPOSE_FILE="docker-compose.yml"
fi

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check MySQL
print_status "Checking MySQL connection..."
if docker-compose -f "$COMPOSE_FILE" exec mysql mysqladmin ping -h localhost --silent; then
    print_status "✅ MySQL is healthy"
else
    print_error "❌ MySQL is not responding"
fi

# Check Redis
print_status "Checking Redis connection..."
if docker-compose -f "$COMPOSE_FILE" exec redis redis-cli ping | grep -q "PONG"; then
    print_status "✅ Redis is healthy"
else
    print_error "❌ Redis is not responding"
fi

# Check Backend
print_status "Checking Backend API..."
sleep 5
if curl -s -f http://localhost:5000/health > /dev/null; then
    print_status "✅ Backend API is healthy"
else
    print_warning "❌ Backend API is not responding yet (may still be starting)"
fi

# Check Admin Panel
if [ "$PRODUCTION" = false ]; then
    print_status "Checking Admin Panel..."
    if curl -s -f http://localhost:80 > /dev/null; then
        print_status "✅ Admin Panel is healthy"
    else
        print_warning "❌ Admin Panel is not responding yet (may still be starting)"
    fi
fi

# Display service status
print_status "Service Status:"
docker-compose -f "$COMPOSE_FILE" ps

# Display logs for troubleshooting
print_status "Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=10

# Display connection information
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📍 Service URLs:"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo "   Cache Test: http://localhost:5000/health/cache-test"
if [ "$PRODUCTION" = false ]; then
    echo "   Admin Panel: http://localhost:80"
fi
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop services: docker-compose -f $COMPOSE_FILE down"
echo "   Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "   Check Redis: docker-compose -f $COMPOSE_FILE exec redis redis-cli ping"
echo "   Check MySQL: docker-compose -f $COMPOSE_FILE exec mysql mysql -u root -p -e 'SELECT 1'"
echo ""
echo "📊 Redis Commands:"
echo "   Redis CLI: docker-compose -f $COMPOSE_FILE exec redis redis-cli"
echo "   Redis Info: docker-compose -f $COMPOSE_FILE exec redis redis-cli info"
echo "   Redis Monitor: docker-compose -f $COMPOSE_FILE exec redis redis-cli monitor"
echo ""

# Test Redis caching
print_status "Testing Redis caching..."
if curl -s http://localhost:5000/health | grep -q '"available":true'; then
    print_status "✅ Redis caching is working!"
else
    print_warning "⚠️ Redis caching may not be working properly"
fi

echo "✨ All done! Your application is running with Redis caching."