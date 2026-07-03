// ============================================
// BuildTrack — Root Application Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure Modules
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { QueueModule } from './modules/queue/queue.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';

// Feature Modules
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { DailyReportModule } from './modules/daily-report/daily-report.module';
import { MaterialModule } from './modules/material/material.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { WorkerModule } from './modules/worker/worker.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ReportModule } from './modules/report/report.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Finance Modules
import { AdvanceModule } from './modules/advance/advance.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { AssetModule } from './modules/asset/asset.module';
import { FinanceDashboardModule } from './modules/finance-dashboard/finance-dashboard.module';
import { BankLoanModule } from './modules/bank-loan/bank-loan.module';
import { BOQModule } from './modules/boq/boq.module';
import { SubcontractorModule } from './modules/subcontractor/subcontractor.module';
import { FundingSourceModule } from './modules/funding-source/funding-source.module';

import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './modules/audit/audit.interceptor';

// Configuration
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { storageConfig } from './config/storage.config';
import { notificationConfig } from './config/notification.config';

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  imports: [
    // ── Configuration ──────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, storageConfig, notificationConfig],
      envFilePath: ['.env', '../../.env'],
    }),

    // ── Rate Limiting ──────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    // ── Scheduled Tasks ────────────────────
    ScheduleModule.forRoot(),

    // ── Infrastructure ─────────────────────
    DatabaseModule,
    AuthModule,
    StorageModule,
    QueueModule,
    NotificationModule,
    AuditModule,

    // ── Feature Modules ────────────────────
    CompanyModule,
    UserModule,
    ProjectModule,
    TaskModule,
    DailyReportModule,
    MaterialModule,
    ExpenseModule,
    WorkerModule,
    AttendanceModule,
    ReportModule,
    DashboardModule,

    // ── Finance Modules ────────────────────
    AdvanceModule,
    PurchaseModule,
    AssetModule,
    FinanceDashboardModule,
    BankLoanModule,
    BOQModule,
    SubcontractorModule,
    FundingSourceModule,
  ],
})
export class AppModule {}
