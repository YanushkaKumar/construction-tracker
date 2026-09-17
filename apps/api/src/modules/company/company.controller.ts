import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';
import { CompanyId, RequirePermissions } from '../../common/decorators';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Company')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get current company details' })
  @RequirePermissions('company:view')
  findOne(@CompanyId() companyId: string) {
    return this.companyService.findById(companyId);
  }

  @Patch()
  @Roles('COMPANY_OWNER')
  @ApiOperation({ summary: 'Update company details' })
  @RequirePermissions('company:manage')
  update(@CompanyId() companyId: string, @Body() data: any) {
    return this.companyService.update(companyId, data);
  }
}
