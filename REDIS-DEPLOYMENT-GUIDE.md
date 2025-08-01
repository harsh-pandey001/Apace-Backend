# Redis Deployment Guide for APACE Transportation Backend

This guide covers different methods to deploy your application with Redis caching.

## 🚀 Deployment Methods

### 1. Docker Compose Deployment (Recommended)

#### **Development Environment**

```bash
# Start all services (MySQL, Redis, Backend, Admin Panel)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

#### **Production Environment**

```bash
# Create production environment file
cp .env.example .env.prod

# Edit .env.prod with production values
nano .env.prod

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### **Production Environment Variables**

Create a `.env.prod` file with these variables:

```bash
# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=apace_db
MYSQL_USER=apace_user
MYSQL_PASSWORD=your_secure_db_password

# JWT
JWT_SECRET=your_jwt_secret_key_change_this
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis (optional password)
REDIS_PASSWORD=your_redis_password

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Google Cloud VM Deployment

#### **Setup Script**

```bash
#!/bin/bash
# deploy-with-redis.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/your-username/APACE-Transportation-Backend.git
cd APACE-Transportation-Backend

# Set up environment
cp .env.example .env.prod

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### **Firewall Configuration**

```bash
# Allow required ports
sudo ufw allow 80/tcp     # Admin Panel
sudo ufw allow 5000/tcp   # Backend API
sudo ufw allow 22/tcp     # SSH
sudo ufw enable
```

### 3. Vercel Deployment with External Redis

#### **Using Redis Cloud**

1. **Sign up for Redis Cloud** at https://redis.com/try-free/
2. **Create a database** and get connection details
3. **Set environment variables** in Vercel:

```bash
# Vercel Environment Variables
REDIS_URL=redis://username:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
CACHE_ENABLED=true
CACHE_TTL_DEFAULT=300
```

#### **Using Upstash Redis**

1. **Sign up for Upstash** at https://upstash.com/
2. **Create Redis database**
3. **Set environment variables**:

```bash
# Upstash Redis
REDIS_URL=redis://username:password@host:port
CACHE_ENABLED=true
```

### 4. AWS Deployment with ElastiCache

#### **AWS ElastiCache Setup**

```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id apace-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id apace-redis \
  --show-cache-node-info
```

#### **Docker Compose for AWS**

```yaml
# docker-compose.aws.yml
version: '3.8'

services:
  backend:
    image: gcr.io/ayush-bot/apace-backend:latest
    environment:
      - NODE_ENV=production
      - REDIS_HOST=your-elasticache-endpoint
      - REDIS_PORT=6379
      - CACHE_ENABLED=true
      # ... other env vars
    ports:
      - "5000:5000"
```

## 🔧 Redis Configuration Options

### **Basic Configuration**

```bash
# Environment Variables
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
CACHE_TTL_DEFAULT=300
```

### **Redis URL Format**

```bash
# Without password
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://username:password@host:port

# With SSL
REDIS_URL=rediss://username:password@host:port
```

### **Redis Security**

```bash
# Production Redis security
redis-server --requirepass your_secure_password
redis-server --protected-mode yes
redis-server --bind 127.0.0.1
```

## 🛠️ Docker Commands

### **Build and Deploy**

```bash
# Build custom image
docker build -t apace-backend .

# Run with Redis
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3

# Update services
docker-compose pull
docker-compose up -d
```

### **Monitoring**

```bash
# View logs
docker-compose logs -f redis
docker-compose logs -f backend

# Check Redis
docker exec -it apace-redis redis-cli ping
docker exec -it apace-redis redis-cli info memory

# Check backend health
curl http://localhost:5000/health
```

### **Backup and Recovery**

```bash
# Backup Redis data
docker exec apace-redis redis-cli BGSAVE
docker cp apace-redis:/data/dump.rdb ./backup/

# Backup MySQL data
docker exec apace-mysql mysqldump -u root -p apace_db > backup/db.sql

# Restore Redis
docker cp ./backup/dump.rdb apace-redis:/data/
docker restart apace-redis
```

## 🧪 Testing Redis Integration

### **Health Check**

```bash
# Test Redis connection
curl http://localhost:5000/health

# Test cache functionality
curl http://localhost:5000/health/cache-test
```

### **Cache Performance Testing**

```bash
# Test user endpoints (should cache)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/profile

# Test public endpoints (should cache)
curl http://localhost:5000/api/vehicles
```

## 🔍 Troubleshooting

### **Redis Connection Issues**

```bash
# Check Redis container
docker ps | grep redis

# Check Redis logs
docker logs apace-redis

# Test Redis connection
docker exec -it apace-redis redis-cli ping

# Check network connectivity
docker exec -it apace-backend ping redis
```

### **Cache Miss Issues**

```bash
# Check cache configuration
curl http://localhost:5000/api/debug/env-check

# Monitor cache operations
docker exec -it apace-redis redis-cli monitor
```

### **Performance Issues**

```bash
# Check Redis memory usage
docker exec -it apace-redis redis-cli info memory

# Check cache hit ratio
docker exec -it apace-redis redis-cli info stats
```

## 📊 Monitoring and Metrics

### **Redis Monitoring**

```bash
# Memory usage
docker exec -it apace-redis redis-cli info memory

# Cache statistics
docker exec -it apace-redis redis-cli info stats

# Connected clients
docker exec -it apace-redis redis-cli client list
```

### **Application Metrics**

```bash
# Health endpoint
curl http://localhost:5000/health

# Cache statistics
curl http://localhost:5000/api/debug/env-check
```

## 🚀 Production Optimization

### **Redis Configuration**

```bash
# Production Redis config
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

### **Performance Tuning**

```bash
# Connection pooling
REDIS_POOL_SIZE=10
REDIS_POOL_MIN=2

# Cache TTL optimization
CACHE_TTL_USER_PROFILE=300
CACHE_TTL_VEHICLE_PRICING=600
CACHE_TTL_PUBLIC_DATA=900
```

## 📝 Deployment Checklist

- [ ] Redis container is running
- [ ] Backend can connect to Redis
- [ ] Cache is working (test with /health endpoint)
- [ ] Environment variables are set correctly
- [ ] Firewall rules allow Redis port (if needed)
- [ ] Backup strategy is in place
- [ ] Monitoring is configured
- [ ] SSL/TLS is configured (production)
- [ ] Redis authentication is enabled (production)

## 🔗 Useful Commands

```bash
# Quick deployment
docker-compose up -d

# Check all services
docker-compose ps

# View all logs
docker-compose logs -f

# Clean restart
docker-compose down -v && docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```