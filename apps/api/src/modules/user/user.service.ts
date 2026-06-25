import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

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
}
