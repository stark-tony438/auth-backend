import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [TranslateController],
  providers: [TranslateService],
  exports: [TranslateService],
})
export class TranslateModule {}
