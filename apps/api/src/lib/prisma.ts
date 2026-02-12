// Import compat: support both ESM named export and CommonJS default export
const clientModule = await import('@prisma/client');
const PrismaClientCtor =
  (clientModule as any).PrismaClient ?? (clientModule as any).default ?? (clientModule as any);

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClientCtor> | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new (PrismaClientCtor as any)({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
