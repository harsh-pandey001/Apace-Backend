#!/bin/bash

# Deploy to Google Cloud VM
# Usage: ./scripts/deploy-to-vm.sh

set -e

# Configuration
VM_NAME="apace-backend"
VM_ZONE="us-central1-a"  # Update this to your VM's zone
PROJECT_ID="ayush-bot"
VM_USER=""  # Let gcloud determine the OS Login user
VM_IP="34.44.169.87"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to VM...${NC}"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}.env.prod file not found!${NC}"
    echo -e "${YELLOW}Please create .env.prod with production environment variables${NC}"
    exit 1
fi

# Create deployment directory on VM
echo -e "${YELLOW}Creating deployment directory on VM...${NC}"
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="mkdir -p ~/apace-deployment"

# Copy necessary files to VM
echo -e "${YELLOW}Copying files to VM...${NC}"
gcloud compute scp docker-compose.prod.yml ${VM_NAME}:~/apace-deployment/docker-compose.yml --zone=${VM_ZONE} --project=${PROJECT_ID}
gcloud compute scp .env.prod ${VM_NAME}:~/apace-deployment/.env --zone=${VM_ZONE} --project=${PROJECT_ID}

# Copy and run auth setup script
echo -e "${YELLOW}Setting up authentication on VM...${NC}"
gcloud compute scp scripts/setup-vm-auth.sh ${VM_NAME}:~/setup-vm-auth.sh --zone=${VM_ZONE} --project=${PROJECT_ID}
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="chmod +x ~/setup-vm-auth.sh && ~/setup-vm-auth.sh"

# Pull latest images and start services
echo -e "${YELLOW}Deploying services on VM...${NC}"
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="
cd ~/apace-deployment && \
docker compose pull && \
docker compose down && \
docker compose up -d
"

# Wait a bit for services to start
sleep 10

# Check deployment status
echo -e "${YELLOW}Checking deployment status...${NC}"
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} --command="
cd ~/apace-deployment && \
docker compose ps
"

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}Services available at:${NC}"
echo -e "  - Admin Panel: http://${VM_IP}"
echo -e "  - Backend API: http://${VM_IP}:5000"

# Show logs command
echo -e "${YELLOW}To view logs, SSH into the VM and run:${NC}"
echo -e "  cd ~/apace-deployment && docker compose logs -f"