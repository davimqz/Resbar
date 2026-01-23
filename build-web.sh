#!/usr/bin/env bash
# Build script for Vercel frontend deployment

echo "Installing pnpm..."
npm install -g pnpm

echo "Installing dependencies..."
pnpm install

echo "Building shared package..."
cd packages/shared
pnpm build

echo "Building web app..."
cd ../../apps/web
pnpm build

echo "Build complete!"
