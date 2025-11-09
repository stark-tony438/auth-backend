import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop() name?: string;
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: false })
  isVerified: boolean;
}
// Converts your decorated class into an actual Mongoose schema
export const UserSchema = SchemaFactory.createForClass(User);
