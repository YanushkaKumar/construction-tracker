import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from './storage.service';
import { CurrentUser, CompanyId } from '../../common/decorators';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { IsString } from 'class-validator';

class PresignedUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  path: string; // e.g., "projects/abc123/site-photos"
}

@ApiTags('Storage')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-upload')
  @ApiOperation({ summary: 'Get pre-signed URL for file upload' })
  async getPresignedUploadUrl(
    @Body() dto: PresignedUploadDto,
    @CompanyId() companyId: string,
  ) {
    const key = this.storageService.generateKey(companyId, dto.path, dto.fileName);
    return this.storageService.getPresignedUploadUrl(key, dto.contentType);
  }

  @Post('presigned-download')
  @ApiOperation({ summary: 'Get pre-signed URL for file download' })
  async getPresignedDownloadUrl(@Body('key') key: string) {
    const url = await this.storageService.getPresignedDownloadUrl(key);
    return { url };
  }
}
