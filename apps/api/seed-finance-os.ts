import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Finance OS Data Migration...');

  // 1. Ensure all companies have a ProjectWallet for every project
  const projects = await prisma.project.findMany();
  
  console.log(`Found ${projects.length} projects. Ensuring wallets...`);
  for (const project of projects) {
    let wallet = await prisma.projectWallet.findUnique({ where: { projectId: project.id } });
    
    if (!wallet) {
      console.log(`Creating wallet for Project: ${project.name}`);
      wallet = await prisma.projectWallet.create({
        data: {
          projectId: project.id,
          companyId: project.companyId,
          balance: 0,
          totalAllocated: 0,
          totalSpent: 0,
          reservedAmount: 0,
        }
      });
    }

    // Optional: Calculate and migrate balance from legacy advances & allocations
    const advances = await prisma.projectAdvance.aggregate({
      where: { projectId: project.id, status: { in: ['RECEIVED', 'PARTIAL_RETURN'] } },
      _sum: { amount: true }
    });
    const allocations = await prisma.purchaseAllocation.aggregate({
      where: { projectId: project.id },
      _sum: { amount: true }
    });
    const expenses = await prisma.expense.aggregate({
      where: { projectId: project.id, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { amount: true }
    });

    const totalAllocated = Number(advances._sum.amount || 0);
    const totalSpent = Number(allocations._sum.amount || 0) + Number(expenses._sum.amount || 0);
    const balance = totalAllocated - totalSpent;

    await prisma.projectWallet.update({
      where: { id: wallet.id },
      data: {
        totalAllocated,
        totalSpent,
        balance,
      }
    });
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
