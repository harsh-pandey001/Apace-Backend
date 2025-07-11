#!/bin/bash

# Redis Monitoring Script for APACE Transportation Backend

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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if Redis container is running
if ! docker ps | grep -q "apace-redis"; then
    print_error "Redis container is not running!"
    exit 1
fi

print_header "Redis Connection Status"
if docker exec apace-redis redis-cli ping | grep -q "PONG"; then
    print_status "✅ Redis is responding"
else
    print_error "❌ Redis is not responding"
    exit 1
fi

print_header "Redis Server Info"
docker exec apace-redis redis-cli info server | grep -E "(redis_version|uptime|process_id)"

print_header "Redis Memory Usage"
docker exec apace-redis redis-cli info memory | grep -E "(used_memory_human|maxmemory_human|mem_fragmentation_ratio)"

print_header "Redis Statistics"
docker exec apace-redis redis-cli info stats | grep -E "(total_connections_received|total_commands_processed|keyspace_hits|keyspace_misses)"

print_header "Redis Keyspace"
docker exec apace-redis redis-cli info keyspace

print_header "Redis Connected Clients"
docker exec apace-redis redis-cli client list | wc -l | xargs echo "Connected clients:"

print_header "Cache Keys by Pattern"
echo "APACE Cache Keys:"
docker exec apace-redis redis-cli keys "apace:*" | wc -l | xargs echo "Total APACE cache keys:"

echo "User cache keys:"
docker exec apace-redis redis-cli keys "apace:user:*" | wc -l | xargs echo "User cache keys:"

echo "Driver cache keys:"
docker exec apace-redis redis-cli keys "driver:*" | wc -l | xargs echo "Driver cache keys:"

echo "Public cache keys:"
docker exec apace-redis redis-cli keys "apace:public:*" | wc -l | xargs echo "Public cache keys:"

print_header "Cache Hit Ratio"
HITS=$(docker exec apace-redis redis-cli info stats | grep keyspace_hits | cut -d: -f2 | tr -d '\r')
MISSES=$(docker exec apace-redis redis-cli info stats | grep keyspace_misses | cut -d: -f2 | tr -d '\r')

if [ "$HITS" -gt 0 ] || [ "$MISSES" -gt 0 ]; then
    TOTAL=$((HITS + MISSES))
    if [ "$TOTAL" -gt 0 ]; then
        RATIO=$(echo "scale=2; $HITS * 100 / $TOTAL" | bc -l)
        echo "Cache hit ratio: $RATIO%"
    fi
fi

print_header "Recent Redis Commands"
echo "Monitoring Redis commands for 5 seconds..."
timeout 5 docker exec apace-redis redis-cli monitor | head -20

print_header "Application Health Check"
if curl -s http://localhost:5000/health | grep -q '"available":true'; then
    print_status "✅ Application reports Redis as available"
else
    print_warning "⚠️ Application may not be connecting to Redis properly"
fi

print_header "Useful Redis Commands"
echo "Interactive Redis CLI:"
echo "  docker exec -it apace-redis redis-cli"
echo ""
echo "Clear all cache:"
echo "  docker exec apace-redis redis-cli flushall"
echo ""
echo "Clear APACE cache only:"
echo "  docker exec apace-redis redis-cli eval \"return redis.call('del', unpack(redis.call('keys', 'apace:*')))\" 0"
echo ""
echo "Monitor Redis commands:"
echo "  docker exec apace-redis redis-cli monitor"
echo ""
echo "Redis configuration:"
echo "  docker exec apace-redis redis-cli config get '*'"

print_status "Redis monitoring completed!"