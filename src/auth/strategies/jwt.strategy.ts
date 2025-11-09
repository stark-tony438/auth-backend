// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config?.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub)
      throw new UnauthorizedException('Invalid token');
    const user = await this.userModel
      .findById(payload.sub)
      .select('_id email isVerified roles')
      .lean();
    if (!user) throw new UnauthorizedException('User not found');
    if (payload.typ && payload.typ !== 'access')
      throw new UnauthorizedException('Invalid token type');
    return {
      id: user._id.toString(),
      email: user.email,
      //   roles: user.roles || [],
    };
  }
}
