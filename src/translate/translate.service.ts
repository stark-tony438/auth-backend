import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
  private defaultTarget: string;

  constructor(private config: ConfigService) {
    this.defaultTarget =
      this.config.get<string>('TRANSLATE_TARGET_LANG') || 'en';
  }

  async translate(
    text: string,
    targetLang?: string,
    sourceLang: string = 'auto',
  ) {
    if (!text) return '';

    try {
      const q = encodeURIComponent(text);
      const source = sourceLang === 'auto' ? 'auto' : sourceLang;
      const target = targetLang || this.defaultTarget;
      const url = `${process.env.TRANSLATE_API_URL}/get?q=${q}&langpair=${source}|${target}`;
      const res = await axios.get(url);
      return res.data?.responseData?.translatedText || '';
    } catch (err: any) {
      console.error('Translation failed:', err.message);
      throw err;
    }
  }
}
