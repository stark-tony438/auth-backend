import { Controller, Post, Body } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateDto } from './dto/translate.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Translate')
@Controller('api/translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @ApiOperation({ summary: 'Translate text (public endpoint, no auth)' })
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
