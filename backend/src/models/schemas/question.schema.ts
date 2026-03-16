import { InferSchemaType, model, Schema } from "mongoose";

const optionSchema = new Schema({
    label: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
}, { _id: false });

export const questionSchema = new Schema({
    text: { type: String, required: true },
    type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'open-ended'],
        required: true
    },
    explanation: { type: String },
    policy: {
        type: String,
        enum: ['private', 'public'],
        required: true
    },
    topicId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    correctAnswer: { type: Boolean },
    options: { type: [optionSchema], default: [] }
}, {
    timestamps: true
});

type Question = InferSchemaType<typeof questionSchema>;

export const Question = model<Question>('Question', questionSchema, 'questions');
