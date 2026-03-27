import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

const notificationSettingsSchema = new Schema(
  {
    newCommunication: { type: Boolean, default: true },
    newEvent: { type: Boolean, default: true },
    newTest: { type: Boolean, default: true },
    testCorrected: { type: Boolean, default: true },
  },
  { _id: false },
);

const acceptationSchema = new Schema(
  {
    accepted: { type: Boolean, default: false },
    timestamp: { type: Date },
    version: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    cognitoId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    organizationIds: { type: [Schema.Types.ObjectId], default: [] },
    notificationSettings: { type: notificationSettingsSchema },
    termsAcceptation: { type: acceptationSchema },
    privacyAcceptation: { type: acceptationSchema },
  },
  {
    timestamps: true,
  },
);

type UserRaw = InferSchemaType<typeof userSchema>;
export type User = HydratedDocument<UserRaw>;

export const User = model<User>("User", userSchema, "users");
