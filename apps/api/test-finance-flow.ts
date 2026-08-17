import { PrismaClient } from '@prisma/client';
import { ProjectService } from './src/modules/project/project.service';
import { ProcurementService } from './src/modules/procurement/procurement.service';
import { FinanceDashboardService } from './src/modules/finance-dashboard/finance-dashboard.service';

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- STARTING ENTERPRISE FINANCE FULL E2E TEST ---');

  // We need to fetch the demo company and user first
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst();
  if (!company || !user) {
    console.error('No company or user found. Make sure to run seed-demo-user.ts first.');
    process.exit(1);
  }
  
  const projectService = new ProjectService(prisma as any);
  const procurementService = new ProcurementService(prisma as any);
  const dashboardService = new FinanceDashboardService(prisma as any);

  try {
    // 1. Create a Project (This should trigger Wallet Creation automatically)
    console.log('\n[1] Creating Project & Wallet...');
    const project = await projectService.create(company.id, {
      name: 'E2E Test Project',
      status: 'PLANNING',
      budgetEstimate: 5000000,
    });
    console.log(`Created Project: ${project.name} (${project.id})`);

    const wallet = await prisma.projectWallet.findUnique({ where: { projectId: project.id } });
    if (!wallet) throw new Error('Wallet was not created for the project!');
    console.log(`Wallet verified for project. Initial Balance: ${wallet.balance}`);

    // 2. Fund the Wallet (Simulate receiving client advance)
    console.log('\n[2] Funding the Project Wallet...');
    const fundingSource = await prisma.fundingSource.create({
      data: {
        companyId: company.id,
        name: 'Client Advance Test',
        type: 'CLIENT_PROGRESS_PAYMENT',
        openingBalance: 1000000,
        originalAmount: 1000000,
        currentBalance: 1000000,
        remainingAmount: 1000000,
      }
    });
    
    // Allocate to wallet
    await prisma.$transaction([
      prisma.fundingAllocation.create({
        data: {
          fundingSourceId: fundingSource.id,
          projectWalletId: wallet.id,
          amount: 500000,
        }
      }),
      prisma.fundingSource.update({
        where: { id: fundingSource.id },
        data: { currentBalance: { decrement: 500000 }, remainingAmount: { decrement: 500000 } }
      }),
      prisma.projectWallet.update({
        where: { id: wallet.id },
        data: { 
          balance: { increment: 500000 },
          totalAllocated: { increment: 500000 }
        }
      })
    ]);
    
    const updatedWallet = await prisma.projectWallet.findUnique({ where: { id: wallet.id } });
    console.log(`Wallet funded. New Balance: ${updatedWallet?.balance}`);
    if (Number(updatedWallet?.balance) !== 500000) throw new Error('Wallet funding failed');

    // 3. Create a Purchase Request
    console.log('\n[3] Creating Purchase Request...');
    const purchase = await prisma.purchase.create({
      data: {
        companyId: company.id,
        projectWalletId: wallet.id,
        title: 'Test Cement Order',
        vendor: 'Holcim Lanka',
        totalAmount: 200000,
        category: 'PROJECT_MATERIAL',
        purchaseDate: new Date(),
        paidAmount: 0,
        status: 'PENDING',
        workflowStage: 'REQUEST',
        purchasedById: user.id,
      }
    });
    console.log(`Purchase Request created. ID: ${purchase.id}`);

    // 4. Move through Procurement Lifecycle
    console.log('\n[4] Advancing Procurement Workflow...');
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'APPROVAL', user.id);
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'PO_GENERATED', user.id);
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'GOODS_RECEIVED', user.id);
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'INVOICED', user.id);
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'BILLED', user.id);
    
    const advancedPurchase = await prisma.purchase.findUnique({ where: { id: purchase.id } });
    console.log(`Purchase is now at stage: ${advancedPurchase?.workflowStage}`);

    // 5. Process Payment from Wallet
    console.log('\n[5] Processing Payment...');
    const payment = await procurementService.processPayment(
      purchase.id, 
      company.id, 
      200000, 
      'BANK_TRANSFER', 
      wallet.id, 
      user.id
    );
    console.log(`Payment successful. Payment ID: ${payment.id}`);

    // Mark completed
    await procurementService.advanceWorkflowStage(purchase.id, company.id, 'COMPLETED', user.id);
    console.log(`Purchase marked COMPLETED.`);

    // 6. Verify Wallet Balances & Deductions
    console.log('\n[6] Verifying Final Balances...');
    const finalWallet = await prisma.projectWallet.findUnique({ where: { id: wallet.id } });
    console.log(`Final Wallet Balance: ${finalWallet?.balance}`);
    console.log(`Final Wallet Total Spent: ${finalWallet?.totalSpent}`);

    if (Number(finalWallet?.balance) !== 300000) throw new Error('Balance deduction failed!');
    if (Number(finalWallet?.totalSpent) !== 200000) throw new Error('Spent tracking failed!');
    console.log('✅ Wallets logic perfectly validated.');

    // 7. Verify Dashboard Service integration
    console.log('\n[7] Verifying Finance Dashboard Engine...');
    const dashboard = await dashboardService.getProjectBalance(project.id);
    console.log(`Dashboard Engine Balance: ${dashboard.balance}`);
    console.log(`Dashboard Engine Total Spent: ${dashboard.totalSpent}`);
    console.log(`Dashboard Engine Total Allocated: ${dashboard.totalAdvance}`);
    
    if (dashboard.balance !== 300000) throw new Error('Dashboard Engine integration failed!');
    console.log('✅ Dashboard Engine perfectly validated.');

    console.log('\n==================================================');
    console.log('🚀 ENTERPRISE FINANCE SYSTEM PASSED ALL TESTS!');
    console.log('==================================================\n');

  } catch (e: any) {
    console.error('\n❌ TEST FAILED:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
