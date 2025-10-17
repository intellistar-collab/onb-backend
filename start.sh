#!/bin/sh

echo "🚀 Starting OneNightBox Backend Application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
  echo "🎯 Starting NestJS application..."
  npm run start:prod
else
  echo "⚠️  Migration failed, falling back to db push..."
  echo "📝 This will apply schema changes without preserving data"
  npx prisma db push --accept-data-loss
  
  if [ $? -eq 0 ]; then
    echo "✅ Database schema updated successfully"
    echo "🎯 Starting NestJS application..."
    npm run start:prod
  else
    echo "❌ Failed to update database schema"
    exit 1
  fi
fi
