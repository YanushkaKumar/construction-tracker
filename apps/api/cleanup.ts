import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up all users from local public.users table to fix sync issues...');
  
  try {
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user ${user.email} from local DB.`);
      
      // Attempt to clean up company if it was only for this user
      if (user.companyId) {
        try {
          await prisma.company.delete({ where: { id: user.companyId } });
          console.log(`Deleted associated company ID ${user.companyId}.`);
        } catch (e) {
          // company might be linked to other things, ignore
        }
      }
    }
    console.log('Cleanup complete!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
