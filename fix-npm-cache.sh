#!/bin/bash

# Fix npm cache permission issues
# This script resolves common npm cache permission problems

echo "🔧 Fixing npm cache permission issues..."

# Check if npm cache has permission issues
if ! npm cache verify > /dev/null 2>&1; then
    echo "❌ npm cache has permission issues"
    
    # Try to fix permissions (requires sudo)
    echo "🔄 Attempting to fix npm cache permissions..."
    
    # Get current user ID and group ID
    USER_ID=$(id -u)
    GROUP_ID=$(id -g)
    
    echo "User ID: $USER_ID, Group ID: $GROUP_ID"
    
    # Option 1: Fix permissions (requires sudo)
    echo "To fix permissions, run:"
    echo "sudo chown -R $USER_ID:$GROUP_ID \"$HOME/.npm\""
    
    # Option 2: Alternative - use temporary cache
    echo ""
    echo "Or use temporary cache for npm commands:"
    echo "npm install --cache /tmp/npm-cache"
    echo "npm audit fix --cache /tmp/npm-cache"
    
    # Option 3: Clean cache alternative
    echo ""
    echo "Or set npm cache to a different location:"
    echo "npm config set cache /tmp/npm-cache"
    
else
    echo "✅ npm cache is healthy"
fi

echo "🎯 For this project, you can use:"
echo "cd AdminPanel && npm install --cache /tmp/npm-cache"
echo "npm audit fix --cache /tmp/npm-cache"