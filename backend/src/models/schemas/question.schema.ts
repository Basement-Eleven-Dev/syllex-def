import {
  HydratedDocument,
  InferSchemaType,
  model,
  Schema,
  UpdateQuery,
} from "mongoose";

const optionSchema = new Schema(
  {
    label: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

export const questionSchema = new Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["scelta multipla", "vero falso", "risposta aperta"],
      required: true,
    },
    explanation: { type: String },
    policy: {
      type: String,
      enum: ["private", "public"],
      required: true,
    },
    topicId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    correctAnswer: { type: Boolean },
    aiGenerated: { type: Boolean },
    options: { type: [optionSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

export type QuestionRaw = InferSchemaType<typeof questionSchema>;
export type Question = HydratedDocument<QuestionRaw>;
export type QuestionUpdate = UpdateQuery<QuestionRaw>;
export const Question = model<Question>(
  "Question",
  questionSchema,
  "questions",
);
