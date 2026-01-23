import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
  const email = 'davimqz2003@gmail.com';
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    
    console.log(`✅ Usuário ${user.name} (${user.email}) promovido para ADMIN com sucesso!`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ Usuário com email ${email} não encontrado. Faça login primeiro.`);
    } else {
      console.error('❌ Erro ao promover usuário:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
