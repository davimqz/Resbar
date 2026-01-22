#!/usr/bin/env bash
# Build script for Render deployment

echo "Installing dependencies..."
pnpm install

echo "Generating Prisma Client..."
cd packages/database
pnpm prisma generate

echo "Building shared package..."
cd ../shared
pnpm build

echo "Building API..."
cd ../../apps/api
pnpm build

echo "Build complete!"
