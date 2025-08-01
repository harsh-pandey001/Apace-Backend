# Deployment Guide

## Quick Deploy

To deploy the entire application stack to Google Cloud VM, simply run:

```bash
./deploy.sh
```

This single script handles everything:
- ✅ Checks prerequisites (gcloud, docker, .env.prod)
- ✅ Builds Docker images for AMD64 platform
- ✅ Pushes images to Google Container Registry
- ✅ Deploys to the VM with proper authentication
- ✅ Verifies deployment and tests endpoints

## Prerequisites

1. **gcloud CLI** installed and authenticated
2. **Docker** installed and running
3. **.env.prod** file with production environment variables

## What the script does

1. **Validates Environment**
   - Checks for required tools
   - Ensures .env.prod exists
   - Sets correct gcloud project

2. **Builds Images**
   - Builds backend and admin panel for linux/amd64
   - Tags with timestamp and 'latest'

3. **Pushes to GCR**
   - Authenticates with Google Container Registry
   - Pushes both images with proper tags

4. **Deploys to VM**
   - Copies docker-compose.prod.yml and .env.prod
   - Handles authentication on the VM
   - Pulls images and starts services
   - Waits for services to be healthy

5. **Verifies Deployment**
   - Checks container status
   - Tests HTTP endpoints
   - Provides clear success/failure feedback

## Troubleshooting

If deployment fails:

1. Check VM is running:
   ```bash
   gcloud compute instances list --filter="name=apace-backend"
   ```

2. Check logs on VM:
   ```bash
   gcloud compute ssh apace-backend --zone=us-central1-a --command='cd ~/apace-deployment && sudo docker compose logs'
   ```

3. Restart services:
   ```bash
   gcloud compute ssh apace-backend --zone=us-central1-a --command='cd ~/apace-deployment && sudo docker compose restart'
   ```

## Key Lessons Learned

1. **Platform matters**: Always build for the target platform (AMD64 for GCP VMs)
2. **Use sudo for Docker**: On the VM, docker commands need sudo
3. **Authentication is critical**: Both gcloud and sudo gcloud auth configure-docker needed
4. **Keep it simple**: One script is better than multiple complex scripts
5. **Test incrementally**: Pull test images first to verify auth works

## Configuration

Edit these variables in deploy.sh if needed:
- `PROJECT_ID`: Your GCP project
- `VM_NAME`: Your VM instance name  
- `VM_ZONE`: Your VM's zone
- `VM_IP`: Your VM's external IP