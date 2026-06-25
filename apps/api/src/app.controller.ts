// ============================================
// BuildTrack API — General App Controller (Health Check)
// ============================================

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'API Health Check' })
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
