import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { EmailToken } from './schemas/email-token.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { hashToken, makeToken } from './utils/token.util';
import { sendVerificationEmail } from './utils/mailer.util';
import { Types } from 'mongoose';

@Injectable()
class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    @InjectModel(EmailToken.name) private emailTokenModel: Model<EmailToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private getRefreshExpireDays(): number {
    return parseInt(this.config.get('REFRESH_TOKEN_EXP_DAYS') || '30', 10);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const raw = makeToken(32);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
    await this.emailTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      purpose: 'verify',
    });
    const testUrl = await sendVerificationEmail(user.email, {
      token: raw,
      userId: user._id.toString(),
    });
    return { ok: true, message: 'Registered: verify email', testUrl };
  }

  async verifyEmail(token: string, id: string) {
    const tokenHash = hashToken(token);
    const record = await this.emailTokenModel.findOne({
      userId: new Types.ObjectId(id),
      tokenHash,
      purpose: 'verify',
    });
    console.log(record, 'record');
    if (!record) {
      throw new BadRequestException('Invalid or expired token');
    }
    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      throw new BadRequestException('Expired token');
    }

    await this.userModel.updateOne({ _id: id }, { $set: { isVerified: true } });
    await record.deleteOne();
    return { ok: true };
  }

  private createAccessToken(user: User) {
    const payload = { sub: user._id.toString(), email: user.email };
    return this.jwtService.sign(payload);
  }

  async login(email: string, password: string, userAgent?: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException();
    if (!user.isVerified) throw new ForbiddenException('Email not verified');

    const verifyToken = await bcrypt.compare(password, user.passwordHash);

    if (!verifyToken) {
      throw new UnauthorizedException();
    }
    const accessToken = this.createAccessToken(user);
    const rawRefresh = makeToken(48);
    const refreshHash = hashToken(rawRefresh);
    const expiredAt = new Date(
      Date.now() + this.getRefreshExpireDays() * 24 * 3600 * 1000,
    );
    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: refreshHash,
      userAgent: userAgent || '',
      expiredAt,
    });
    return {
      ok: true,
      accessToken,
      refreshToken: rawRefresh,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    };
  }

  async refresh(oldRaw: string) {
    if (!oldRaw) throw new UnauthorizedException();
    const oldHash = hashToken(oldRaw);
    const record = await this.refreshTokenModel.findOne({ tokenHash: oldHash });
    if (!record) throw new UnauthorizedException();
    if (record.expiredAt < new Date()) {
      await record.deleteOne();
      throw new UnauthorizedException();
    }

    // rotate: delete old token create a new one
    await record.deleteOne();

    const newRaw = makeToken(48);
    const newHash = hashToken(newRaw);
    const newExpiresAt = new Date(
      Date.now() + this.getRefreshExpireDays() * 24 * 3600 * 1000,
    );
    await this.refreshTokenModel.create({
      userId: record.userId,
      tokenHash: newHash,
      userAgent: record.userAgent,
      expiredAt: newExpiresAt,
    });
    const user = await this.userModel.findById(record.userId);
    const accessToken = this.createAccessToken(user);

    return {
      ok: true,
      accessToken,
      refreshToken: newRaw,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    };
  }
  async logout(oldRaw?: string) {
    if (!oldRaw) return;
    const oldHash = hashToken(oldRaw);
    await this.refreshTokenModel.deleteOne({ tokenHash: oldHash });
    return { ok: true };
  }
}

export default AuthService;
