#!/usr/bin/env bash
# Build script for Render deployment

echo "Installing dependencies..."
pnpm install

echo "Deploying Prisma migrations and generating Prisma Client..."
cd packages/database
npx prisma migrate deploy --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/schema.prisma

echo "Building shared package..."
cd ../shared
pnpm build

echo "Building API..."
cd ../../apps/api
pnpm build

echo "Build complete!"
