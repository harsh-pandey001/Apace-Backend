#!/bin/bash

# Setup authentication on VM for GCR access
# This script should be run once on the VM

set -e

echo "Setting up VM authentication for GCR..."

# Add user to docker group
sudo usermod -aG docker $USER

# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker --quiet gcr.io

# Use the VM's service account
gcloud config set account $(gcloud config get-value account)

# Test authentication
echo "Testing GCR access..."
sudo docker pull gcr.io/google-containers/pause:latest

echo "Authentication setup complete!"