import { InferSchemaType, model, Schema } from "mongoose";
import { questionSchema } from "./question.schema";

const attemptQuestionSchema = new Schema({
    question: { type: questionSchema, required: true },
    score: { type: Number, default: 0 },
    points: { type: Number, required: true },
    status: {
        type: String,
        enum: ['correct', 'incorrect', 'partial', 'pending'],
        default: 'pending'
    },
    answer: { type: String },
    teacherComment: { type: String },
    aiProbability: { type: Number }
}, { _id: false });

const attemptSchema = new Schema({
    testId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    status: {
        type: String,
        enum: ['in-progress', 'delivered', 'reviewed'],
        default: 'in-progress'
    },
    startedAt: { type: Date },
    deliveredAt: { type: Date },
    reviewedAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    fitTestScore: { type: Boolean },
    questions: { type: [attemptQuestionSchema], default: [] },
    aiInsight: { type: String },
    source: { type: String }
});

type Attempt = InferSchemaType<typeof attemptSchema>;

export const Attempt = model<Attempt>('Attempt', attemptSchema, 'attempts');
