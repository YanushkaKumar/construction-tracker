import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@lankabuild.lk';
  const password = 'password123';
  const firstName = 'Demo';
  const lastName = 'Owner';
  const companyName = 'Lanka Builders (Demo)';

  console.log(`Starting to seed user: ${email}...`);

  // 1. Check if user already exists in public.users
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    console.log(`User ${email} already exists in local DB. Deleting to start fresh...`);
    await prisma.user.deleteMany({ where: { email } });
  }

  // 2. Generate a UUID for the new user
  const userId = crypto.randomUUID();

  // 3. Insert into Supabase auth.users directly via SQL
  // This bypasses the rate limit completely!
  console.log('Inserting into Supabase auth.users...');
  try {
    // Delete if exists first
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email = $1`, email);

    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        $1::uuid,
        'authenticated',
        'authenticated',
        $2,
        crypt($3, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"first_name":"${firstName}","last_name":"${lastName}","company_name":"${companyName}"}',
        false,
        false
      )
    `, userId, email, password);
    console.log('Successfully inserted into auth.users');
  } catch (err: any) {
    console.error('Failed to insert into auth.users. Make sure you are using the Supabase connection string.');
    console.error(err.message);
    process.exit(1);
  }

  // 4. Create Company and User in public schema
  console.log('Creating Company and User in public schema...');
  const company = await prisma.company.create({
    data: {
      name: companyName,
      slug: 'lanka-builders-demo',
      address: '123 Demo Street, Colombo',
      phone: '+94771234567',
      settings: {
        currency: 'LKR',
        timezone: 'Asia/Colombo',
      },
    },
  });

  const localPasswordHash = await bcrypt.hash(password, 10);

  const role = await prisma.role.create({
    data: {
      name: 'COMPANY_OWNER',
      displayName: 'Company Owner',
      companyId: company.id,
      isSystem: true,
      permissions: ['*'],
    }
  });

  await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash: localPasswordHash,
      firstName,
      lastName,
      roleId: role.id,
      companyId: company.id,
      isActive: true,
    },
  });

  console.log('\n==================================================');
  console.log('✅ DEMO ACCOUNT CREATED SUCCESSFULLY!');
  console.log('You can now log in immediately with:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
