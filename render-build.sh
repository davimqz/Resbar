build:
  - cd packages/database && pnpm install && pnpm prisma generate
  - cd ../../apps/api && pnpm install && pnpm build
