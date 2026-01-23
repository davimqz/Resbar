const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = process.env.TARGET_EMAIL || 'davimqz2003@gmail.com';
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log('Updated user:', { id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error('Error updating user:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
