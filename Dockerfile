# Use Node.js 18 Alpine image for smaller size
FROM node:18-alpine

# Install bash and other dependencies
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev) for debugging
RUN npm install

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Run startup test (file already copied with COPY . .)
RUN node test-startup.js

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]