# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build argument for API URL
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Build the React app
RUN npm run build

# Production stage - Use Node.js Alpine for serving static files
FROM node:18-alpine

# Install serve package globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/build ./build

# Create a simple health check endpoint
RUN echo '{"status":"ok","service":"apace-admin"}' > ./build/health.json

# Expose port (Cloud Run expects 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health.json || exit 1

# Start the application using serve
CMD ["serve", "-s", "build", "-l", "8080"]