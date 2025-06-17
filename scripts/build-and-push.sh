#!/bin/bash

# Build and push Docker images to Google Container Registry
# Usage: ./scripts/build-and-push.sh

set -e

# Configuration
PROJECT_ID="ayush-bot"
REGION="us-central1"
REGISTRY="gcr.io"
TAG=$(date +%Y%m%d-%H%M%S)
LATEST_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build and push process...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}Not logged in to gcloud. Please run 'gcloud auth login'${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Configure Docker to use gcloud as credential helper
echo -e "${YELLOW}Configuring Docker for GCR...${NC}"
gcloud auth configure-docker

# Build images for AMD64 platform (for GCP VM)
echo -e "${YELLOW}Building backend image for AMD64...${NC}"
docker build --platform linux/amd64 -t ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG} -t ${REGISTRY}/${PROJECT_ID}/apace-backend:${LATEST_TAG} .

echo -e "${YELLOW}Building admin panel image for AMD64...${NC}"
docker build --platform linux/amd64 -t ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG} -t ${REGISTRY}/${PROJECT_ID}/apace-admin:${LATEST_TAG} ./AdminPanel

# Push images
echo -e "${YELLOW}Pushing backend image...${NC}"
docker push ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG}
docker push ${REGISTRY}/${PROJECT_ID}/apace-backend:${LATEST_TAG}

echo -e "${YELLOW}Pushing admin panel image...${NC}"
docker push ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG}
docker push ${REGISTRY}/${PROJECT_ID}/apace-admin:${LATEST_TAG}

echo -e "${GREEN}Build and push completed successfully!${NC}"
echo -e "${GREEN}Images pushed:${NC}"
echo -e "  - ${REGISTRY}/${PROJECT_ID}/apace-backend:${TAG}"
echo -e "  - ${REGISTRY}/${PROJECT_ID}/apace-backend:${LATEST_TAG}"
echo -e "  - ${REGISTRY}/${PROJECT_ID}/apace-admin:${TAG}"
echo -e "  - ${REGISTRY}/${PROJECT_ID}/apace-admin:${LATEST_TAG}"

# Save the tag for deployment
echo ${TAG} > .last-build-tag

echo -e "${YELLOW}Tag saved to .last-build-tag for deployment${NC}"