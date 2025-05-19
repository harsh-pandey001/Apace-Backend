# Deploying to Vercel

This guide walks you through deploying the APACE Transportation Backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (`npm i -g vercel`)
3. A MySQL database hosted on a cloud provider (e.g., PlanetScale, Railway, Aiven)

## Database Setup

Since Vercel doesn't provide MySQL hosting, you'll need to use an external service. Here are some options:

1. **PlanetScale** (Recommended)
   - Free tier available
   - Serverless MySQL compatible with Vercel
   - Visit https://planetscale.com

2. **Railway**
   - Easy setup with MySQL
   - Visit https://railway.app

3. **Aiven**
   - Managed MySQL service
   - Visit https://aiven.io

## Deployment Steps

1. **Set up your database**
   - Create a MySQL database with your chosen provider
   - Get your connection details (host, username, password, database name)
   - Make sure to enable SSL for production

2. **Configure environment variables**
   ```bash
   # In your project directory
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add JWT_REFRESH_SECRET
   vercel env add NODE_ENV
   # Add other variables as needed
   ```

3. **Deploy to Vercel**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy
   vercel --prod
   ```

4. **Configure production environment variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all required environment variables:
     - `DATABASE_URL` or individual database credentials
     - `JWT_SECRET`
     - `JWT_REFRESH_SECRET`
     - `NODE_ENV` = "production"
     - `CORS_ORIGIN` = your frontend URL

## Environment Variables

### Required Variables:
- `DATABASE_URL`: Full MySQL connection string (recommended)
  OR
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `NODE_ENV`: Set to "production"

### Optional Variables:
- `CORS_ORIGIN`: Your frontend domain (defaults to * in development)
- `JWT_EXPIRES_IN`: Token expiration time (default: 1h)
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration (default: 7d)

## Post-Deployment

1. **Run database migrations**
   - Vercel will automatically run migrations via the `vercel-build` script
   - Check logs to ensure migrations completed successfully

2. **Test your API**
   - Your API will be available at: `https://your-project.vercel.app`
   - Test the health endpoint: `https://your-project.vercel.app/health`

3. **Monitor logs**
   - Use Vercel dashboard or CLI: `vercel logs`

## Troubleshooting

### Database Connection Issues
- Ensure your database allows connections from Vercel's IP ranges
- Check that SSL is enabled for production connections
- Verify your DATABASE_URL format is correct

### Migration Failures
- Check Vercel build logs for detailed error messages
- Ensure your database user has CREATE/ALTER permissions
- Manual migration: Connect to your database and run migrations locally

### CORS Issues
- Update CORS_ORIGIN environment variable with your frontend URL
- Check that your frontend includes proper headers

## Alternative Deployment Options

While Vercel works for Node.js APIs, consider these platforms for better backend support:

1. **Railway** - Full Node.js support with included database
2. **Render** - Easy deployment with MySQL support
3. **Heroku** - Traditional PaaS with add-on ecosystem
4. **AWS Elastic Beanstalk** - For AWS infrastructure
5. **Google Cloud Run** - Serverless containers

## Important Notes

- Vercel is optimized for frontend/static sites. For complex backends, consider the alternatives above.
- Serverless functions have a 10-second timeout on Vercel's free tier
- Database connections should use connection pooling
- Consider using a connection pool service like PlanetScale's serverless driver