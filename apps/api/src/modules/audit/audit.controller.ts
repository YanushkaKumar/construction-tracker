import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { CompanyId } from '../../common/decorators';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List company audit logs' })
  findAll(@CompanyId() companyId: string, @Query('limit') limit?: string) {
    return this.auditService.findAll(companyId, limit ? Number(limit) : 100);
  }
}
