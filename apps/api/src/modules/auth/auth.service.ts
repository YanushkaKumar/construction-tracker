import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { JwtPayload, JwtRefreshPayload } from '../../common/types/jwt-payload.type';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_OWNER = 'COMPANY_OWNER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_ENGINEER = 'SITE_ENGINEER',
  QUANTITY_SURVEYOR = 'QUANTITY_SURVEYOR',
  ACCOUNTANT = 'ACCOUNTANT',
  WORKER = 'WORKER',
}

export enum Permission {
  COMPANY_MANAGE = 'company:manage',
  COMPANY_VIEW = 'company:view',
  USERS_MANAGE = 'users:manage',
  USERS_VIEW = 'users:view',
  PROJECTS_CREATE = 'projects:create',
  PROJECTS_MANAGE_ALL = 'projects:manage_all',
  PROJECTS_MANAGE_ASSIGNED = 'projects:manage_assigned',
  PROJECTS_VIEW = 'projects:view',
  TASKS_CREATE = 'tasks:create',
  TASKS_ASSIGN = 'tasks:assign',
  TASKS_UPDATE_STATUS = 'tasks:update_status',
  TASKS_VIEW = 'tasks:view',
  DAILY_REPORTS_SUBMIT = 'daily_reports:submit',
  DAILY_REPORTS_VIEW = 'daily_reports:view',
  MATERIALS_MANAGE = 'materials:manage',
  MATERIALS_VIEW = 'materials:view',
  EXPENSES_SUBMIT = 'expenses:submit',
  EXPENSES_APPROVE = 'expenses:approve',
  EXPENSES_VIEW_ALL = 'expenses:view_all',
  EXPENSES_VIEW_OWN = 'expenses:view_own',
  WORKERS_MANAGE = 'workers:manage',
  WORKERS_VIEW = 'workers:view',
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_VIEW_OWN = 'attendance:view_own',
  REPORTS_FINANCIAL = 'reports:financial',
  REPORTS_PROGRESS = 'reports:progress',
  REPORTS_LABOUR = 'reports:labour',
  NOTIFICATIONS_MANAGE = 'notifications:manage',
}

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.SUPER_ADMIN]: Object.values(Permission),
  [SystemRole.COMPANY_OWNER]: [
    Permission.COMPANY_MANAGE,
    Permission.COMPANY_VIEW,
    Permission.USERS_MANAGE,
    Permission.USERS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_MANAGE_ALL,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_PROGRESS,
    Permission.REPORTS_LABOUR,
    Permission.NOTIFICATIONS_MANAGE,
  ],
  [SystemRole.PROJECT_MANAGER]: [
    Permission.COMPANY_VIEW,
    Permission.USERS_VIEW,
    Permission.PROJECTS_CREATE,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.REPORTS_PROGRESS,
    Permission.REPORTS_LABOUR,
  ],
  [SystemRole.SITE_ENGINEER]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_CREATE,
    Permission.TASKS_ASSIGN,
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_SUBMIT,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_VIEW_OWN,
    Permission.WORKERS_MANAGE,
    Permission.WORKERS_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_VIEW,
  ],
  [SystemRole.QUANTITY_SURVEYOR]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_MANAGE_ASSIGNED,
    Permission.PROJECTS_VIEW,
    Permission.TASKS_VIEW,
    Permission.DAILY_REPORTS_VIEW,
    Permission.MATERIALS_MANAGE,
    Permission.MATERIALS_VIEW,
    Permission.EXPENSES_SUBMIT,
    Permission.EXPENSES_VIEW_ALL,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_PROGRESS,
  ],
  [SystemRole.ACCOUNTANT]: [
    Permission.COMPANY_VIEW,
    Permission.PROJECTS_VIEW,
    Permission.EXPENSES_APPROVE,
    Permission.EXPENSES_VIEW_ALL,
    Permission.REPORTS_FINANCIAL,
    Permission.REPORTS_LABOUR,
  ],
  [SystemRole.WORKER]: [
    Permission.TASKS_UPDATE_STATUS,
    Permission.TASKS_VIEW,
    Permission.ATTENDANCE_VIEW_OWN,
  ],
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new company with owner account
   */
  async register(dto: RegisterDto) {
    if (this.prisma.isOffline) {
      this.logger.warn(`Database is offline. Performing mock registration for ${dto.email}`);
      const mockCompanyId = 'mock-company-' + this.slugify(dto.companyName);
      const mockUserId = 'mock-user-id-' + dto.firstName.toLowerCase();
      
      const mockUser = {
        id: mockUserId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: { name: 'COMPANY_OWNER', displayName: 'Company Owner', permissions: ['*'] },
      };

      const mockCompany = {
        id: mockCompanyId,
        name: dto.companyName,
        slug: this.slugify(dto.companyName),
      };

      const accessPayload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        companyId: mockCompany.id,
        role: mockUser.role.name,
        permissions: mockUser.role.permissions,
      };
      const accessToken = this.jwtService.sign(accessPayload);

      const refreshToken = this.jwtService.sign({ sub: mockUser.id, tokenId: 'mock-refresh-token-id' }, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: '7d',
      });

      return {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role.name,
          roleDisplayName: mockUser.role.displayName,
          permissions: mockUser.role.permissions,
        },
        company: {
          id: mockCompany.id,
          name: mockCompany.name,
          slug: mockCompany.slug,
        },
        accessToken,
        refreshToken,
      };
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('auth.bcryptRounds', 12),
    );

    // Create company, owner role, and user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          slug: this.slugify(dto.companyName),
          email: dto.email,
          phone: dto.phone,
        },
      });

      // Create default system roles for this company
      const roles = await this.createDefaultRoles(tx, company.id);
      const ownerRole = roles.find((r) => r.name === 'COMPANY_OWNER')!;

      // Create owner user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          roleId: ownerRole.id,
        },
        include: { role: true },
      });

      return { company, user };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user, result.company.id);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role.name,
        roleDisplayName: result.user.role.displayName,
        permissions: Array.isArray(result.user.role.permissions)
          ? result.user.role.permissions
          : JSON.parse((result.user.role.permissions as string) || '[]'),
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
      },
      ...tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto) {
    if (this.prisma.isOffline) {
      this.logger.warn(`Database is offline. Performing mock login for ${dto.email}`);
      
      const roleMap: Record<string, { name: string; displayName: string; permissions: string[] }> = {
        'owner@lankabuild.lk': {
          name: 'COMPANY_OWNER',
          displayName: 'Company Owner',
          permissions: ['*'],
        },
        'pm@lankabuild.lk': {
          name: 'PROJECT_MANAGER',
          displayName: 'Project Manager',
          permissions: ['project:read', 'project:create', 'task:create', 'worker:read'],
        },
        'engineer@lankabuild.lk': {
          name: 'SITE_ENGINEER',
          displayName: 'Site Engineer',
          permissions: ['project:read', 'task:update', 'daily-report:create', 'worker:attendance'],
        },
      };

      const emailKey = dto.email.toLowerCase();
      const mockRole = roleMap[emailKey] || {
        name: 'COMPANY_OWNER',
        displayName: 'Company Owner',
        permissions: ['*'],
      };

      const firstName = emailKey.includes('owner') ? 'Chamara' : emailKey.includes('pm') ? 'Nimal' : 'Kasun';
      const lastName = emailKey.includes('owner') ? 'Perera' : emailKey.includes('pm') ? 'Fernando' : 'Silva';
      const mockUser = {
        id: 'mock-user-id-' + (emailKey.split('@')[0] || 'user'),
        email: dto.email,
        firstName,
        lastName,
        avatar: null,
        role: { name: mockRole.name, displayName: mockRole.displayName, permissions: mockRole.permissions },
        companyId: 'mock-company-id',
      };

      const mockCompany = {
        id: 'mock-company-id',
        name: 'Lanka Build Pvt Ltd',
        slug: 'lanka-build-pvt-ltd',
        logo: null,
      };

      const accessPayload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        companyId: mockUser.companyId,
        role: mockUser.role.name,
        permissions: mockRole.permissions,
      };
      const accessToken = this.jwtService.sign(accessPayload);

      const refreshToken = this.jwtService.sign({ sub: mockUser.id, tokenId: 'mock-refresh-token-id' }, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: '7d',
      });

      return {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          avatar: mockUser.avatar,
          role: mockUser.role.name,
          roleDisplayName: mockUser.role.displayName,
        },
        company: {
          id: mockCompany.id,
          name: mockCompany.name,
          slug: mockCompany.slug,
          logo: mockCompany.logo,
        },
        accessToken,
        refreshToken,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { role: true, company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user, user.companyId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
        permissions: Array.isArray(user.role.permissions)
          ? user.role.permissions
          : JSON.parse((user.role.permissions as string) || '[]'),
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        logo: user.company.logo,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    if (this.prisma.isOffline) {
      try {
        const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
          secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        });
        
        const isOwner = payload.sub.includes('owner');
        const isPm = payload.sub.includes('pm');
        const role = isOwner ? 'COMPANY_OWNER' : isPm ? 'PROJECT_MANAGER' : 'SITE_ENGINEER';
        const permissions = isOwner ? ['*'] : ['project:read'];
        
        const accessToken = this.jwtService.sign({
          sub: payload.sub,
          email: isOwner ? 'owner@lankabuild.lk' : isPm ? 'pm@lankabuild.lk' : 'engineer@lankabuild.lk',
          companyId: 'mock-company-id',
          role,
          permissions,
        });
        
        const newRefreshToken = this.jwtService.sign({ sub: payload.sub, tokenId: 'mock-refresh-token-id' }, {
          secret: this.configService.get<string>('auth.jwtRefreshSecret'),
          expiresIn: '7d',
        });
        
        return { accessToken, refreshToken: newRefreshToken };
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      });

      // Find the refresh token in DB
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { id: payload.tokenId },
        include: { user: { include: { role: true } } },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Rotate: revoke old token and issue new one
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const tokens = await this.generateTokens(
        storedToken.user,
        storedToken.user.companyId,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout — revoke refresh token
   */
  async logout(userId: string) {
    if (this.prisma.isOffline) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    if (this.prisma.isOffline || userId.startsWith('mock-')) {
      const email = userId.includes('owner') 
        ? 'owner@lankabuild.lk' 
        : userId.includes('pm') 
        ? 'pm@lankabuild.lk' 
        : 'engineer@lankabuild.lk';

      const firstName = email.includes('owner') ? 'Chamara' : email.includes('pm') ? 'Nimal' : 'Kasun';
      const lastName = email.includes('owner') ? 'Perera' : email.includes('pm') ? 'Fernando' : 'Silva';
      const roleName = email.includes('owner') ? 'COMPANY_OWNER' : email.includes('pm') ? 'PROJECT_MANAGER' : 'SITE_ENGINEER';
      const roleDisplayName = email.includes('owner') ? 'Company Owner' : email.includes('pm') ? 'Project Manager' : 'Site Engineer';
      const permissions = email.includes('owner') ? ['*'] : ['project:read', 'task:update', 'worker:attendance'];

      return {
        id: userId,
        email,
        firstName,
        lastName,
        phone: '+94771234567',
        avatar: null,
        role: roleName,
        roleDisplayName,
        permissions,
        company: {
          id: 'mock-company-id',
          name: 'Lanka Build Pvt Ltd',
          slug: 'lanka-build-pvt-ltd',
          logo: null,
          plan: 'FREE' as any,
        },
        lastLoginAt: new Date().toISOString(),
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role.name,
      roleDisplayName: user.role.displayName,
      permissions: user.role.permissions,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        logo: user.company.logo,
        plan: user.company.plan,
      },
      lastLoginAt: user.lastLoginAt,
    };
  }

  // ── Private Helpers ─────────────────────

  private async generateTokens(
    user: { id: string; email: string; role: { name: string; permissions: any } },
    companyId: string,
  ) {
    const permissions = Array.isArray(user.role.permissions)
      ? user.role.permissions
      : JSON.parse(user.role.permissions as string || '[]');

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId,
      role: user.role.name,
      permissions,
    };

    const accessToken = this.jwtService.sign(accessPayload);

    // Create refresh token
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: uuidv4(),
        expiresAt: new Date(
          Date.now() + this.parseExpiration(
            this.configService.get<string>('auth.jwtRefreshExpiration', '7d'),
          ),
        ),
      },
    });

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      expiresIn: this.configService.get<string>('auth.jwtRefreshExpiration') as any,
    });

    return { accessToken, refreshToken };
  }

  private async createDefaultRoles(tx: any, companyId: string) {

    const roleDefinitions = [
      { name: SystemRole.COMPANY_OWNER, displayName: 'Company Owner' },
      { name: SystemRole.PROJECT_MANAGER, displayName: 'Project Manager' },
      { name: SystemRole.SITE_ENGINEER, displayName: 'Site Engineer' },
      { name: SystemRole.QUANTITY_SURVEYOR, displayName: 'Quantity Surveyor' },
      { name: SystemRole.ACCOUNTANT, displayName: 'Accountant' },
      { name: SystemRole.WORKER, displayName: 'Worker' },
    ];

    const roles = await Promise.all(
      roleDefinitions.map((def) =>
        tx.role.create({
          data: {
            companyId,
            name: def.name,
            displayName: def.displayName,
            permissions: (ROLE_PERMISSIONS as any)[def.name] || [],
            isSystem: true,
          },
        }),
      ),
    );

    return roles;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] || multipliers['d']);
  }
}
