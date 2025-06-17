#!/bin/bash

# Simple deployment script that handles authentication properly

set -e

VM_NAME="apace-backend"
VM_ZONE="us-central1-a"
PROJECT_ID="ayush-bot"
VM_IP="34.44.169.87"

echo "Deploying to VM..."

# SSH into VM and run all commands
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} << 'EOF'
# Setup authentication
echo "Configuring authentication..."
gcloud auth configure-docker --quiet gcr.io
sudo gcloud auth configure-docker --quiet gcr.io

# Create deployment directory
mkdir -p ~/apace-deployment
cd ~/apace-deployment

# Pull and run containers with sudo (which has the auth)
echo "Pulling images..."
sudo docker pull gcr.io/ayush-bot/apace-backend:latest
sudo docker pull gcr.io/ayush-bot/apace-admin:latest
sudo docker pull mysql:8.0

echo "Images pulled successfully!"
EOF

# Copy files
echo "Copying deployment files..."
gcloud compute scp docker-compose.prod.yml ${VM_NAME}:~/apace-deployment/docker-compose.yml --zone=${VM_ZONE} --project=${PROJECT_ID}
gcloud compute scp .env.prod ${VM_NAME}:~/apace-deployment/.env --zone=${VM_ZONE} --project=${PROJECT_ID}

# Start services
echo "Starting services..."
gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --project=${PROJECT_ID} << 'EOF'
cd ~/apace-deployment
sudo docker compose down
sudo docker compose up -d
sleep 10
sudo docker compose ps
EOF

echo "Deployment complete!"
echo "Services available at:"
echo "  - Admin Panel: http://${VM_IP}"
echo "  - Backend API: http://${VM_IP}:5000"