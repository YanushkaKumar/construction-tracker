// ============================================
// BuildTrack — Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo company
  const company = await prisma.company.create({
    data: {
      name: 'Lanka Build Pvt Ltd',
      slug: 'lanka-build',
      registrationNo: 'PV12345',
      address: '123 Galle Road, Colombo 03',
      city: 'Colombo',
      phone: '+94112345678',
      email: 'info@lankabuild.lk',
      plan: 'PROFESSIONAL',
    },
  });
  console.log('✅ Company created:', company.name);

  // Create roles
  const roleDefinitions = [
    { name: 'COMPANY_OWNER', displayName: 'Company Owner', permissions: ['*'] },
    { name: 'PROJECT_MANAGER', displayName: 'Project Manager', permissions: ['projects:*', 'tasks:*', 'daily_reports:*', 'materials:*', 'expenses:*', 'workers:*', 'attendance:*', 'reports:progress', 'reports:labour'] },
    { name: 'SITE_ENGINEER', displayName: 'Site Engineer', permissions: ['projects:view', 'tasks:*', 'daily_reports:*', 'materials:manage', 'expenses:submit', 'workers:manage', 'attendance:mark'] },
    { name: 'QUANTITY_SURVEYOR', displayName: 'Quantity Surveyor', permissions: ['projects:view', 'tasks:view', 'materials:*', 'expenses:submit', 'reports:financial', 'reports:progress'] },
    { name: 'ACCOUNTANT', displayName: 'Accountant', permissions: ['projects:view', 'expenses:approve', 'expenses:view_all', 'reports:financial', 'reports:labour'] },
    { name: 'WORKER', displayName: 'Worker', permissions: ['tasks:update_status', 'tasks:view', 'attendance:view_own'] },
  ];

  const roles: Record<string, any> = {};
  for (const def of roleDefinitions) {
    roles[def.name] = await prisma.role.create({
      data: { companyId: company.id, ...def, isSystem: true },
    });
  }
  console.log('✅ Roles created:', Object.keys(roles).join(', '));

  // Create users
  const passwordHash = await bcrypt.hash('BuildTrack@2026', 12);

  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'owner@lankabuild.lk',
      passwordHash,
      firstName: 'Chamara',
      lastName: 'Perera',
      phone: '+94771234567',
      roleId: roles['COMPANY_OWNER'].id,
    },
  });

  const pm = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'pm@lankabuild.lk',
      passwordHash,
      firstName: 'Nimal',
      lastName: 'Fernando',
      phone: '+94772345678',
      roleId: roles['PROJECT_MANAGER'].id,
    },
  });

  const engineer = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'engineer@lankabuild.lk',
      passwordHash,
      firstName: 'Kasun',
      lastName: 'Silva',
      phone: '+94773456789',
      roleId: roles['SITE_ENGINEER'].id,
    },
  });

  const qs = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'qs@lankabuild.lk',
      passwordHash,
      firstName: 'Dilshan',
      lastName: 'Jayasuriya',
      phone: '+94774567890',
      roleId: roles['QUANTITY_SURVEYOR'].id,
    },
  });

  console.log('✅ Users created: owner, PM, engineer, QS');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      companyId: company.id,
      name: 'Horizon Tower - Colombo 07',
      code: 'PRJ-001',
      description: '12-story residential apartment complex in Colombo 07',
      clientName: 'Mr. Amal Rajapaksa',
      clientPhone: '+94777654321',
      location: 'Colombo 07',
      latitude: 6.9107,
      longitude: 79.8612,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      budgetEstimate: 150000000,
      budgetActual: 85000000,
      progressPercent: 58,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2027-06-01'),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      companyId: company.id,
      name: 'Palm Villa - Negombo',
      code: 'PRJ-002',
      description: 'Luxury 3-bedroom villa with pool in Negombo',
      clientName: 'Mrs. Kumari Bandara',
      clientPhone: '+94778765432',
      location: 'Negombo',
      latitude: 7.2083,
      longitude: 79.8358,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      budgetEstimate: 45000000,
      budgetActual: 18000000,
      progressPercent: 35,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-31'),
    },
  });

  const project3 = await prisma.project.create({
    data: {
      companyId: company.id,
      name: 'Office Renovation - World Trade Center',
      code: 'PRJ-003',
      description: 'Commercial office space renovation, floors 8-10',
      clientName: 'ABC Holdings',
      location: 'Colombo 01',
      status: 'PLANNING',
      priority: 'LOW',
      budgetEstimate: 25000000,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
    },
  });

  console.log('✅ Projects created:', [project1.name, project2.name, project3.name].join(', '));

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: pm.id, projectRole: 'Project Manager' },
      { projectId: project1.id, userId: engineer.id, projectRole: 'Site Engineer' },
      { projectId: project1.id, userId: qs.id, projectRole: 'Quantity Surveyor' },
      { projectId: project2.id, userId: pm.id, projectRole: 'Project Manager' },
      { projectId: project2.id, userId: engineer.id, projectRole: 'Site Engineer' },
    ],
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      { projectId: project1.id, title: 'Complete 8th floor slab casting', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: engineer.id, creatorId: pm.id, dueDate: new Date('2026-07-15') },
      { projectId: project1.id, title: 'Install MEP ducting (floors 1-5)', status: 'TODO', priority: 'MEDIUM', assigneeId: engineer.id, creatorId: pm.id, dueDate: new Date('2026-08-01') },
      { projectId: project1.id, title: 'Plumbing rough-in (6th floor)', status: 'COMPLETED', priority: 'HIGH', assigneeId: engineer.id, creatorId: pm.id, completedAt: new Date('2026-06-20') },
      { projectId: project1.id, title: 'Order steel reinforcement (phase 3)', status: 'TODO', priority: 'URGENT', creatorId: pm.id, dueDate: new Date('2026-06-28') },
      { projectId: project2.id, title: 'Foundation excavation', status: 'COMPLETED', priority: 'HIGH', assigneeId: engineer.id, creatorId: pm.id, completedAt: new Date('2026-03-15') },
      { projectId: project2.id, title: 'Brick wall construction (ground floor)', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: engineer.id, creatorId: pm.id, dueDate: new Date('2026-07-30') },
    ],
  });
  console.log('✅ Tasks created');

  // Create workers
  const workerData = [
    { firstName: 'Saman', lastName: 'Kumara', nic: '881234567V', phone: '+94781234567', skillType: 'Mason', dailyRate: 3500 },
    { firstName: 'Ruwan', lastName: 'Bandara', nic: '901234567V', phone: '+94782345678', skillType: 'Carpenter', dailyRate: 3200 },
    { firstName: 'Ajith', lastName: 'Rathnayake', nic: '851234567V', phone: '+94783456789', skillType: 'Electrician', dailyRate: 4000 },
    { firstName: 'Pradeep', lastName: 'Wijesinghe', nic: '921234567V', phone: '+94784567890', skillType: 'Labourer', dailyRate: 2500 },
    { firstName: 'Kamal', lastName: 'Dissanayake', nic: '871234567V', phone: '+94785678901', skillType: 'Plumber', dailyRate: 3800 },
    { firstName: 'Sunil', lastName: 'Herath', nic: '931234567V', phone: '+94786789012', skillType: 'Helper', dailyRate: 2200 },
  ];

  const workers = await Promise.all(
    workerData.map((w) => prisma.worker.create({ data: { ...w, companyId: company.id } })),
  );
  console.log('✅ Workers created:', workers.length);

  // Create suppliers
  await prisma.supplier.createMany({
    data: [
      { companyId: company.id, name: 'Tokyo Cement Lanka', contactPerson: 'Mr. Senanayake', phone: '+94112223344', email: 'sales@tokyocement.lk', materialTypes: ['Cement'], rating: 5 },
      { companyId: company.id, name: 'Lanka Steel Corporation', contactPerson: 'Mr. Gunawardena', phone: '+94112334455', email: 'info@lankasteel.lk', materialTypes: ['Steel'], rating: 4 },
      { companyId: company.id, name: 'Mahaweli Sand Suppliers', contactPerson: 'Mr. Rathnayake', phone: '+94783334444', materialTypes: ['Sand', 'Aggregate'], rating: 3 },
    ],
  });
  console.log('✅ Suppliers created');

  // Create materials
  await prisma.material.createMany({
    data: [
      { companyId: company.id, name: 'Portland Cement (50kg)', unit: 'bags', unitPrice: 1850, category: 'Cement', currentStock: 250, minimumStock: 50 },
      { companyId: company.id, name: 'TMT Steel Bar 12mm', unit: 'tons', unitPrice: 285000, category: 'Steel', currentStock: 8, minimumStock: 2 },
      { companyId: company.id, name: 'River Sand', unit: 'cu.m', unitPrice: 22000, category: 'Sand', currentStock: 30, minimumStock: 10 },
      { companyId: company.id, name: 'Cement Blocks (6")', unit: 'pieces', unitPrice: 85, category: 'Bricks & Blocks', currentStock: 5000, minimumStock: 500 },
      { companyId: company.id, name: '3/4" Metal Aggregate', unit: 'cu.m', unitPrice: 18000, category: 'Aggregate', currentStock: 20, minimumStock: 5 },
    ],
  });
  console.log('✅ Materials created');

  // Create sample expenses
  await prisma.expense.createMany({
    data: [
      { projectId: project1.id, submittedById: engineer.id, category: 'MATERIAL', title: 'Cement purchase - 200 bags', amount: 370000, expenseDate: new Date('2026-06-15'), status: 'APPROVED', approvedById: pm.id, approvedAt: new Date('2026-06-16') },
      { projectId: project1.id, submittedById: engineer.id, category: 'LABOUR', title: 'Overtime wages - week 24', amount: 85000, expenseDate: new Date('2026-06-20'), status: 'PENDING' },
      { projectId: project1.id, submittedById: pm.id, category: 'EQUIPMENT', title: 'Concrete mixer rental - June', amount: 120000, expenseDate: new Date('2026-06-01'), status: 'APPROVED', approvedById: owner.id, approvedAt: new Date('2026-06-02') },
      { projectId: project2.id, submittedById: engineer.id, category: 'MATERIAL', title: 'Steel reinforcement bars', amount: 1425000, expenseDate: new Date('2026-06-10'), status: 'PENDING' },
    ],
  });
  console.log('✅ Expenses created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Owner:    owner@lankabuild.lk / BuildTrack@2026');
  console.log('   PM:       pm@lankabuild.lk / BuildTrack@2026');
  console.log('   Engineer: engineer@lankabuild.lk / BuildTrack@2026');
  console.log('   QS:       qs@lankabuild.lk / BuildTrack@2026');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
