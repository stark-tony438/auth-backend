import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateDto } from './dto/translate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Translate')
@Controller('api/translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Translate text using LibreTranslate' })
  @ApiBody({ type: TranslateDto })
  @Post()
  async translate(@Body() dto: TranslateDto) {
    const translated = await this.translateService.translate(
      dto.text,
      dto.targetLang,
      dto.sourceLang,
    );
    return { ok: true, translated };
  }
}
