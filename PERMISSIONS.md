# Deployment Permissions Guide

## Required Permissions to Run deploy.sh

To successfully run the deployment script, a user needs the following Google Cloud permissions:

### 1. **Container Registry Access** (roles/storage.admin)
- Push Docker images to gcr.io
- Pull images from gcr.io
- List and manage container images

### 2. **Compute Engine Access** (roles/compute.instanceAdmin.v1 + roles/compute.osLogin)
- SSH into VM instances
- Copy files to VM (gcloud compute scp)
- Execute commands on VM
- OS Login for secure SSH access

### 3. **Project Viewer** (roles/viewer)
- View project resources
- List VM instances
- Access project metadata

## Current Permissions for harsh.pandey@gammaedge.io

✅ **roles/compute.instanceAdmin.v1** - Full control over VM instances
✅ **roles/compute.osLogin** - SSH access to VMs using OS Login
✅ **roles/storage.admin** - Full access to Cloud Storage and Container Registry
✅ **roles/viewer** - Read access to all project resources

## How to Grant Permissions

To grant these permissions to another user:

```bash
# Grant Container Registry access
gcloud projects add-iam-policy-binding ayush-bot \
  --member="user:email@example.com" \
  --role="roles/storage.admin"

# Grant Compute Instance Admin access
gcloud projects add-iam-policy-binding ayush-bot \
  --member="user:email@example.com" \
  --role="roles/compute.instanceAdmin.v1"

# Grant OS Login access
gcloud projects add-iam-policy-binding ayush-bot \
  --member="user:email@example.com" \
  --role="roles/compute.osLogin"

# Grant Project Viewer access
gcloud projects add-iam-policy-binding ayush-bot \
  --member="user:email@example.com" \
  --role="roles/viewer"
```

## Minimum Permissions (More Restrictive)

If you want to grant more restrictive permissions:

1. **For Container Registry only**:
   - `roles/storage.objectAdmin` on bucket `gs://artifacts.ayush-bot.appspot.com`

2. **For Compute Engine**:
   - `roles/compute.instanceAdmin` on specific VM only
   - `roles/iam.serviceAccountUser` on the VM's service account

3. **For minimal project access**:
   - `roles/compute.viewer` instead of `roles/viewer`

## Prerequisites for User's Local Machine

1. **gcloud CLI** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project ayush-bot
   ```

2. **Docker** installed and running

3. **Git** access to pull the repository

## Troubleshooting Permission Issues

If you encounter permission errors:

1. **"Permission denied" pushing to GCR**:
   - Ensure `roles/storage.admin` is granted
   - Run `gcloud auth configure-docker gcr.io`

2. **"Permission denied" SSH to VM**:
   - Ensure `roles/compute.osLogin` is granted
   - Check if VM allows SSH from your IP

3. **"Project not found"**:
   - Ensure `roles/viewer` is granted
   - Verify project ID is correct