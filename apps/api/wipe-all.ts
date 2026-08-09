import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeAll() {
  console.log('Wiping all data from local DB and Supabase Auth...');
  
  try {
    // 1. Delete all companies (this cascades to projects, finances, users, etc. due to onDelete: Cascade)
    const companies = await prisma.company.findMany();
    for (const c of companies) {
      await prisma.company.delete({ where: { id: c.id } });
      console.log(`Deleted company ${c.name} and all its data.`);
    }

    // 2. Delete all remaining users (if any were not tied to a company)
    const users = await prisma.user.findMany();
    for (const u of users) {
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`Deleted user ${u.email}`);
    }

    // 3. Clean Supabase Auth directly (danger zone, but requested)
    console.log('Cleaning up Supabase auth.users...');
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users`);
    console.log('Deleted all users from Supabase auth.users.');

    console.log('\nFULL WIPE COMPLETE! The system is now a blank slate.');
  } catch (err) {
    console.error('Error during wipe:', err);
  } finally {
    await prisma.$disconnect();
  }
}

wipeAll();
