import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: PaginationDto) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { companyId },
        include: { role: true },
        orderBy: { [query.sort || 'createdAt']: query.order || 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where: { companyId } }),
    ]);

    return {
      data: users.map(({ passwordHash, ...user }) => user),
      meta: { total, page: query.page!, limit: query.limit!, totalPages: Math.ceil(total / query.limit!) },
    };
  }

  async findById(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...result } = user;
    return result;
  }

  async findRoles(companyId: string) {
    return this.prisma.role.findMany({
      where: {
        OR: [
          { companyId },
          { companyId: null }, // System roles
        ],
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async create(companyId: string, dto: CreateUserDto) {
    // Check if user already exists in this company
    const existing = await this.prisma.user.findFirst({
      where: { companyId, email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists in your company');
    }

    // Verify role exists and is either system or company specific
    const role = await this.prisma.role.findFirst({
      where: {
        id: dto.roleId,
        OR: [
          { companyId },
          { companyId: null },
        ],
      },
    });
    if (!role) {
      throw new NotFoundException('Selected role not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: true,
      },
      include: { role: true },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, companyId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: {
          id: dto.roleId,
          OR: [
            { companyId },
            { companyId: null },
          ],
        },
      });
      if (!role) {
        throw new NotFoundException('Selected role not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      include: { role: true },
    });

    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async delete(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (e) {
      // Cascade/FK failure - deactivate user instead
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'User has related records, deactivated account instead' };
    }
  }
}

