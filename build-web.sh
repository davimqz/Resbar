#!/usr/bin/env sh
set -e

echo "==> Installing pnpm..."
npm install -g pnpm@latest

echo "==> Installing root dependencies..."
pnpm install --no-frozen-lockfile

echo "==> Building shared package..."
cd packages/shared
pnpm build
cd ../..

echo "==> Building web app..."
cd apps/web
pnpm build

echo "==> Build complete!"
