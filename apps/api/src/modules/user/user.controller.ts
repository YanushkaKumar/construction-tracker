import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CompanyId, CurrentUser, Roles } from '../../common/decorators';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List roles available in company' })
  findRoles(@CompanyId() companyId: string) {
    return this.userService.findRoles(companyId);
  }

  @Get()
  @ApiOperation({ summary: 'List company users' })
  findAll(@CompanyId() companyId: string, @Query() query: PaginationDto) {
    return this.userService.findAll(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.userService.findById(id, companyId);
  }

  @Post()
  @Roles('COMPANY_OWNER', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'Create a new team member' })
  create(
    @CompanyId() companyId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.create(companyId, dto);
  }

  @Patch(':id')
  @Roles('COMPANY_OWNER', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'Update a team member details' })
  update(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, companyId, dto);
  }

  @Delete(':id')
  @Roles('COMPANY_OWNER', 'PROJECT_MANAGER')
  @ApiOperation({ summary: 'Delete or deactivate a team member' })
  remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (currentUser.sub === id) {
      throw new ForbiddenException('You cannot delete or deactivate your own account');
    }
    return this.userService.delete(id, companyId);
  }
}

