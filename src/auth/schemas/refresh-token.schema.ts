import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true })
  expiredAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
