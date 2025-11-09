import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import AuthService from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth')
class AuthController {
  constructor(private auth: AuthService) {}
  @ApiOperation({ summary: 'Register a new User ' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'User registered successfully ' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @ApiOperation({ summary: 'Verify email using token and user id' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Email verification token',
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description: 'User id to verify',
  })
  @ApiOkResponse({ description: 'Email verified and redirected' })
  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Query('id') id: string,
    @Res() res: Response,
  ) {
    await this.auth.verifyEmail(token, id);
    return res.json({ status: 200, url: `${process.env.APP_URL}/login` });
  }
  @ApiOperation({ summary: 'Login and receive access & refresh tokens' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description:
      'Returns access token and user object. Refresh token set as httpOnly cookie',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.auth.login(
      dto.email,
      dto.password,
      req.get('user-agent') || '',
    );
    // set refresh cookie
    const expiresDays = parseInt(
      process.env.REFRESH_TOKEN_EXP_DAYS || '30',
      10,
    );
    const maxAge = (expiresDays * 24 * 3600 * 1000) / 1000;
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(maxAge),
    });
    return res.json({
      ok: true,
      accessToken: result.accessToken,
      user: result.user,
    });
  }
  @ApiOperation({ summary: 'Refresh access token using refresh-token cookie' })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    description:
      'Returns new access token and user object. New refresh token set as httpOnly cookie',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const old = req.cookies?.refreshToken;
    const result = await this.auth.refresh(old);
    const expiresDays = parseInt(
      process.env.REFRESH_TOKEN_EXP_DAYS || '30',
      10,
    );
    const maxAge = (expiresDays * 24 * 3600 * 1000) / 1000; // seconds
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(maxAge),
    });
    return res.json({
      ok: true,
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({ description: 'Logged out successfully' })
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const raw = req.cookies?.refreshToken;
    await this.auth.logout(raw);
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ ok: true });
  }
}

export default AuthController;
