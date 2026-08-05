import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupFull() {
  console.log('Cleaning up users from BOTH local DB and Supabase Auth...');
  const emails = ['yanushkakumaar@gmail.com', 'yanushkakuma@gmail.com'];
  
  try {
    for (const email of emails) {
      console.log(`\n--- Cleaning up: ${email} ---`);
      // 1. Clean local DB
      const users = await prisma.user.findMany({ where: { email } });
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`Deleted user ${user.email} from local DB.`);
        
        if (user.companyId) {
          try {
            await prisma.company.delete({ where: { id: user.companyId } });
            console.log(`Deleted associated company ID ${user.companyId}.`);
          } catch (e) {}
        }
      }

      // 2. Clean Supabase Auth (since we have postgres access)
      console.log('Attempting to delete from Supabase auth.users directly...');
      await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email = $1`, email);
      console.log(`Deleted user ${email} from Supabase auth.users.`);
    }
    
    console.log('\nFull cleanup complete!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupFull();
