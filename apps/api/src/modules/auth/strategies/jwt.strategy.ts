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
      // Must be the same secret AuthModule signs with — reading a different
      // one here (e.g. a Supabase secret) silently invalidates every token
      // this API issues.
      secretOrKey: configService.get<string>('auth.jwtSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Resolve by user id, never by email: email is only unique *per company*
    // (@@unique([companyId, email])), so an email lookup can match a user in
    // a different tenant entirely.
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found in system');
    }

    let permissions: string[] = [];
    if (typeof user.role.permissions === 'string') {
      try { permissions = JSON.parse(user.role.permissions); } catch (e) {}
    } else if (Array.isArray(user.role.permissions)) {
      // Stored as Prisma Json, so the array members are JsonValue — keep only
      // the strings rather than trusting the column's shape.
      permissions = user.role.permissions.filter(
        (p): p is string => typeof p === 'string',
      );
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
