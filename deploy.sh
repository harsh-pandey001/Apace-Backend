#!/bin/bash

# Complete deployment script for APACE Backend
# This script builds, pushes, and deploys the application to Google Cloud VM

set -e

# Configuration
PROJECT_ID="ayush-bot"
REGISTRY="gcr.io"
VM_NAME="apace-backend"
VM_ZONE="us-central1-a"
VM_IP="34.44.169.87"
TAG=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    exit 1
fi

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    print_error ".env.prod file not found!"
    print_warning "Creating template .env.prod file..."
    cat > .env.prod << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MYSQL_ROOT_PASSWORD=prodRootPass2024!
MYSQL_DATABASE=apace_db
MYSQL_USER=apace_user
MYSQL_PASSWORD=prodApacePass2024!

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-production-jwt-secret-key-change-this-immediately
JWT_REFRESH_SECRET=your-production-jwt-refresh-secret-key-change-this-immediately
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://34.44.169.87
EOF
    print_warning "Please update .env.prod with your production values and run this script again."
    exit 1
fi

print_success "Prerequisites check passed"

# Set gcloud project
print_status "Setting gcloud project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID} --quiet

# Configure Docker for GCR
print_status "Configuring Docker for Google Container Registry..."
gcloud auth configure-docker gcr.io --quiet

# Build images for AMD64 platform
print_status "Building Docker images for AMD64 platform..."

print_status "Building backend image..."
docker build --platform linux/amd64 \
    -t ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG} \
    -t ${REGISTRY}/${PROJECT_ID}/apace-backend:latest \
    .

print_status "Building admin panel image..."
docker build --platform linux/amd64 \
    -t ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG} \
    -t ${REGISTRY}/${PROJECT_ID}/apace-admin:latest \
    ./AdminPanel

print_success "Docker images built successfully"

# Push images to GCR
print_status "Pushing images to Google Container Registry..."

print_status "Pushing backend image..."
docker push ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG}
docker push ${REGISTRY}/${PROJECT_ID}/apace-backend:latest

print_status "Pushing admin panel image..."
docker push ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG}
docker push ${REGISTRY}/${PROJECT_ID}/apace-admin:latest

print_success "Images pushed to GCR successfully"

# Deploy to VM
print_status "Deploying to VM ${VM_NAME}..."

# Create deployment script
cat > /tmp/deploy-on-vm.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "Setting up deployment on VM..."

# Configure Docker to use GCR
echo "Configuring Docker authentication..."
gcloud auth configure-docker gcr.io --quiet
sudo gcloud auth configure-docker gcr.io --quiet

# Create deployment directory
mkdir -p ~/apace-deployment
cd ~/apace-deployment

# Stop existing containers
echo "Stopping existing containers..."
sudo docker compose down 2>/dev/null || true

# Pull latest images
echo "Pulling latest images..."
sudo docker pull gcr.io/ayush-bot/apace-backend:latest
sudo docker pull gcr.io/ayush-bot/apace-admin:latest
sudo docker pull mysql:8.0

# Start services
echo "Starting services..."
sudo docker compose up -d

# Wait for services to start
sleep 15

# Show status
echo "Checking deployment status..."
sudo docker compose ps
DEPLOY_SCRIPT

# Copy necessary files to VM
print_status "Copying deployment files to VM..."
gcloud compute scp docker-compose.prod.yml ${VM_NAME}:~/apace-deployment/docker-compose.yml --zone=${VM_ZONE} --project=${PROJECT_ID} --quiet
gcloud compute scp .env.prod ${VM_NAME}:~/apace-deployment/.env --zone=${VM_ZONE} --project=${PROJECT_ID} --quiet
gcloud compute scp /tmp/deploy-on-vm.sh ${VM_NAME}:~/deploy-on-vm.sh --zone=${VM_ZONE} --project=${PROJECT_ID} --quiet

# Execute deployment on VM
print_status "Executing deployment on VM..."
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="chmod +x ~/deploy-on-vm.sh && ~/deploy-on-vm.sh"

# Clean up
rm -f /tmp/deploy-on-vm.sh

# Final status check
print_status "Performing final status check..."
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="cd ~/apace-deployment && sudo docker compose ps"

# Test endpoints
print_status "Testing endpoints..."

# Test admin panel
if curl -s -o /dev/null -w "%{http_code}" http://${VM_IP} | grep -q "200"; then
    print_success "Admin Panel is accessible at http://${VM_IP}"
else
    print_error "Admin Panel is not responding"
fi

# Test backend API
if curl -s http://${VM_IP}:5000 > /dev/null 2>&1; then
    print_success "Backend API is accessible at http://${VM_IP}:5000"
else
    print_warning "Backend API may take a moment to start"
fi

# Print summary
echo ""
echo "========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "========================================="
echo ""
echo "Services deployed:"
echo "  - Admin Panel: http://${VM_IP}"
echo "  - Backend API: http://${VM_IP}:5000"
echo ""
echo "Images pushed:"
echo "  - ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG}"
echo "  - ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG}"
echo ""
echo "To check logs on the VM:"
echo "  gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command='cd ~/apace-deployment && sudo docker compose logs -f'"
echo ""
echo "Build tag: ${TAG}"
echo ""