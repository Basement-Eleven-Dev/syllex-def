import { InferSchemaType, model, Schema } from "mongoose";

const passwordResetTokenSchema = new Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  used: { type: Boolean, default: false },
});

type PasswordResetToken = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetToken = model<PasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema,
  "password_reset_tokens",
);
