import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../../common/types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use Supabase JWT secret if available, fallback to custom secret
      secretOrKey: process.env.SUPABASE_JWT_SECRET || configService.get<string>('auth.jwtSecret') || 'default-secret',
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    // payload could be a Supabase JWT (contains email) or custom JWT
    const email = payload.email;

    if (!email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found in system');
    }

    let permissions = [];
    if (typeof user.role.permissions === 'string') {
      try { permissions = JSON.parse(user.role.permissions); } catch (e) {}
    } else if (Array.isArray(user.role.permissions)) {
      permissions = user.role.permissions;
    }

    return {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role.name,
      permissions: permissions,
    };
  }
}
