# OneNightBox Backend Deployment Guide

## Prisma Schema Changes

When you update the `schema.prisma` file, the Dockerfile will automatically handle the database migrations on deployment.

### Production Deployment

The production Dockerfile (`Dockerfile`) uses the following process:

1. **Migration Deploy**: First tries `prisma migrate deploy` to apply existing migrations
2. **Fallback to Push**: If migrations fail, falls back to `prisma db push --accept-data-loss`
3. **Start Application**: Starts the NestJS application

### Development Deployment

The development Dockerfile (`Dockerfile.dev`) uses:

- `prisma db push` for immediate schema changes
- `npm run start:dev` for hot reloading

## Deployment Commands

### Production

```bash
# Build and run production container
docker-compose up backend

# Or build manually
docker build -t onb-backend .
docker run -p 8000:8000 -e DATABASE_URL="your-db-url" onb-backend
```

### Development

```bash
# Build and run development container
docker-compose --profile dev up backend-dev

# Or build manually
docker build -f Dockerfile.dev -t onb-backend-dev .
docker run -p 8001:8000 -e DATABASE_URL="your-db-url" onb-backend-dev
```

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to `production` or `development`

## Database Migration Workflow

### For Schema Changes:

1. **Update schema.prisma** with your changes
2. **Create migration** (for production):
   ```bash
   npx prisma migrate dev --name your-migration-name
   ```
3. **Deploy**: The Docker container will automatically apply migrations

### For Development:

- Just update `schema.prisma` and restart the container
- The container will use `prisma db push` to apply changes immediately

## Troubleshooting

### Migration Fails

If `prisma migrate deploy` fails, the container will automatically fall back to `prisma db push --accept-data-loss`. This means:

- ✅ Schema changes will be applied
- ⚠️ Data might be lost (use with caution in production)

### Database Connection Issues

Ensure your `DATABASE_URL` is correctly set and the database is accessible from the container.

### Container Won't Start

Check the logs:

```bash
docker logs <container-name>
```

The startup script provides detailed logging to help diagnose issues.
