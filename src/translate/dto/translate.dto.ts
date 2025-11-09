import { IsString, IsOptional, MaxLength } from 'class-validator';

export class TranslateDto {
  @IsString()
  @MaxLength(5000)
  text: string;

  @IsOptional()
  @IsString()
  targetLang?: string;

  @IsOptional()
  @IsString()
  sourceLang?: string;
}
