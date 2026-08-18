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
      status: 'UPCOMING',
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
      status: 'UPCOMING',
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

  // ══════════════════════════════════════════
  // Finance Module Seed Data
  // ══════════════════════════════════════════

  // Create sample project advances (Money IN)
  const advance1 = await prisma.projectAdvance.create({
    data: {
      projectId: project1.id,
      companyId: company.id,
      receivedById: owner.id,
      amount: 5000000,
      description: 'Initial project advance from client - Horizon Tower',
      referenceNo: 'CHQ-2025-001',
      receivedDate: new Date('2025-06-10'),
      status: 'RECEIVED',
    },
  });

  const advance2 = await prisma.projectAdvance.create({
    data: {
      projectId: project1.id,
      companyId: company.id,
      receivedById: owner.id,
      amount: 3000000,
      description: 'Second milestone advance - Foundation completion',
      referenceNo: 'CHQ-2025-045',
      receivedDate: new Date('2025-12-15'),
      status: 'RECEIVED',
    },
  });

  const advance3 = await prisma.projectAdvance.create({
    data: {
      projectId: project2.id,
      companyId: company.id,
      receivedById: pm.id,
      amount: 2000000,
      description: 'Initial advance - Palm Villa project',
      referenceNo: 'BANK-TXN-9982',
      receivedDate: new Date('2026-01-20'),
      status: 'RECEIVED',
    },
  });

  const advance4 = await prisma.projectAdvance.create({
    data: {
      projectId: project1.id,
      companyId: company.id,
      receivedById: owner.id,
      amount: 2500000,
      description: 'Third advance - 5th floor slab completion',
      referenceNo: 'CHQ-2026-012',
      receivedDate: new Date('2026-05-01'),
      status: 'RECEIVED',
    },
  });

  console.log('✅ Project advances created:', 4);

  // Create sample purchases with multi-project allocations
  const purchase1 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: engineer.id,
      title: 'Nuts, Bolts & Fasteners (bulk)',
      description: 'Purchased 500kg assorted nuts and bolts for structural work',
      totalAmount: 45000,
      category: 'PROJECT_MATERIAL',
      purchaseDate: new Date('2026-03-15'),
      vendor: 'Lanka Hardware Pvt Ltd',
      allocations: {
        create: [
          { projectId: project1.id, amount: 45000, percentage: 100 },
        ],
      },
    },
  });

  const purchase2 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: engineer.id,
      title: 'Wheelbarrow (Heavy Duty)',
      description: 'Heavy duty construction wheelbarrow - shared between sites',
      totalAmount: 8500,
      category: 'SHARED_TOOL',
      purchaseDate: new Date('2026-02-10'),
      vendor: 'Construction Tools Lanka',
      allocations: {
        create: [
          { projectId: project1.id, amount: 5100, percentage: 60, notes: 'Primary use at Horizon Tower' },
          { projectId: project2.id, amount: 3400, percentage: 40, notes: 'Secondary use at Palm Villa' },
        ],
      },
    },
  });

  const purchase3 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: pm.id,
      title: 'Hammer Set (6 pieces)',
      description: 'Professional grade hammer set for multiple sites',
      totalAmount: 12000,
      category: 'SHARED_TOOL',
      purchaseDate: new Date('2026-01-25'),
      vendor: 'Ace Tools Colombo',
      allocations: {
        create: [
          { projectId: project1.id, amount: 6000, percentage: 50 },
          { projectId: project2.id, amount: 6000, percentage: 50 },
        ],
      },
    },
  });

  const purchase4 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: engineer.id,
      title: 'Tea, Coffee & Lunch - Week 24',
      description: 'Daily refreshments and lunch for site workers',
      totalAmount: 3500,
      category: 'DAILY_EXPENSE',
      purchaseDate: new Date('2026-06-14'),
      allocations: {
        create: [
          { projectId: project1.id, amount: 3500, percentage: 100 },
        ],
      },
    },
  });

  const purchase5 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: engineer.id,
      title: 'Tea & Biscuits - Week 25',
      description: 'Daily tea and biscuits for construction crew',
      totalAmount: 2800,
      category: 'DAILY_EXPENSE',
      purchaseDate: new Date('2026-06-21'),
      allocations: {
        create: [
          { projectId: project2.id, amount: 2800, percentage: 100 },
        ],
      },
    },
  });

  const purchase6 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: pm.id,
      title: 'Plumbing Service - Ground Floor',
      description: 'Hired plumbing contractor for ground floor bathroom fittings',
      totalAmount: 85000,
      category: 'SERVICE',
      purchaseDate: new Date('2026-04-20'),
      vendor: 'ABC Plumbing Services',
      allocations: {
        create: [
          { projectId: project2.id, amount: 85000, percentage: 100 },
        ],
      },
    },
  });

  const purchase7 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: engineer.id,
      title: 'Cement - 100 bags (Portland)',
      description: 'Cement for column casting work',
      totalAmount: 185000,
      category: 'PROJECT_MATERIAL',
      purchaseDate: new Date('2026-05-05'),
      vendor: 'Tokyo Cement Lanka',
      allocations: {
        create: [
          { projectId: project1.id, amount: 185000, percentage: 100 },
        ],
      },
    },
  });

  const purchase8 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      purchasedById: pm.id,
      title: 'Vehicle fuel & transport',
      description: 'Fuel for material transport van for the week',
      totalAmount: 15000,
      category: 'TRANSPORT',
      purchaseDate: new Date('2026-06-10'),
      vendor: 'Shell Fuel Station',
      allocations: {
        create: [
          { projectId: project1.id, amount: 9000, percentage: 60 },
          { projectId: project2.id, amount: 6000, percentage: 40 },
        ],
      },
    },
  });

  console.log('✅ Purchases with allocations created:', 8);

  // Create shared assets
  const asset1 = await prisma.asset.create({
    data: {
      companyId: company.id,
      purchaseId: purchase2.id,
      name: 'Heavy Duty Wheelbarrow',
      category: 'Tool',
      purchasePrice: 8500,
      condition: 'GOOD',
      currentProjectId: project1.id,
      serialNumber: 'WB-001',
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      companyId: company.id,
      name: 'Concrete Mixer (Electric)',
      category: 'Equipment',
      purchasePrice: 185000,
      condition: 'GOOD',
      currentProjectId: project1.id,
      serialNumber: 'MX-001',
      notes: 'Purchased before this system was set up',
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      companyId: company.id,
      purchaseId: purchase3.id,
      name: 'Professional Hammer Set',
      category: 'Tool',
      purchasePrice: 12000,
      condition: 'GOOD',
      currentProjectId: project2.id,
      serialNumber: 'HM-SET-001',
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      companyId: company.id,
      name: 'Spirit Level (4ft)',
      category: 'Tool',
      purchasePrice: 3500,
      condition: 'FAIR',
      currentProjectId: null,
      serialNumber: 'SL-001',
      notes: 'Available in office storage',
    },
  });

  console.log('✅ Assets created:', 4);

  // Create asset assignment history
  await prisma.assetAssignment.createMany({
    data: [
      // Wheelbarrow: started at Palm Villa, moved to Horizon Tower
      {
        assetId: asset1.id,
        projectId: project2.id,
        assignedById: pm.id,
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-04-01'),
        notes: 'Initial assignment for foundation work',
      },
      {
        assetId: asset1.id,
        projectId: project1.id,
        assignedById: pm.id,
        startDate: new Date('2026-04-01'),
        notes: 'Moved to Horizon Tower for slab work',
      },
      // Concrete mixer: always at Horizon Tower
      {
        assetId: asset2.id,
        projectId: project1.id,
        assignedById: owner.id,
        startDate: new Date('2025-07-01'),
        notes: 'Assigned from project start',
      },
      // Hammer set: started at Horizon Tower, moved to Palm Villa
      {
        assetId: asset3.id,
        projectId: project1.id,
        assignedById: pm.id,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-05-15'),
        notes: 'Used for formwork',
      },
      {
        assetId: asset3.id,
        projectId: project2.id,
        assignedById: engineer.id,
        startDate: new Date('2026-05-15'),
        notes: 'Moved for wall construction',
      },
    ],
  });

  console.log('✅ Asset assignments created');

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
