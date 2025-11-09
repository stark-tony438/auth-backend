import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EmailToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
  @Prop({ required: true })
  tokenHash: string;
  @Prop({ required: true })
  expiresAt: Date;
  @Prop({ default: 'verify' })
  purpose: string;
}

export const EmailTokenSchema = SchemaFactory.createForClass(EmailToken);
