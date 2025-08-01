# Docker Setup Guide

## Quick Start

Run the entire application stack with a single command:

```bash
docker-compose up -d
```

This will start:
- MySQL database (port 3307)
- Backend API (port 5000)
- Admin Panel (port 80)

## Access Points

- **Admin Panel**: http://localhost
- **Backend API**: http://localhost:5000
- **MySQL Database**: localhost:3307

## Environment Configuration

1. The docker-compose.yml includes default environment variables
2. For production, update the JWT secrets in docker-compose.yml:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

## Database

- Database name: `apace_db`
- Database user: `apace_user`
- Database password: `apace_password`
- Root password: `rootpassword`

The backend will automatically run migrations and seed data on startup.

## Volumes

- MySQL data is persisted in `./mysql-data`
- File uploads are stored in `./uploads`

## Stopping the Application

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Rebuilding After Changes

```bash
docker-compose up -d --build
```

## Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f admin-panel
docker-compose logs -f mysql
```