import { InferSchemaType, model, Schema } from "mongoose";

const testQuestionSchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, required: true },
    points: { type: Number, required: true }
}, { _id: false });

const testSchema = new Schema({
    name: { type: String, required: true },
    availableFrom: { type: Date, required: true },
    availableTo: { type: Date },
    timeLimit: { type: Number },
    password: { type: String },
    classIds: { type: [Schema.Types.ObjectId], default: [] },
    questions: { type: [testQuestionSchema], default: [] },
    maxScore: { type: Number, required: true },
    fitScore: { type: Number },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    source: { type: String }
}, {
    timestamps: true
});

type Test = InferSchemaType<typeof testSchema>;

export const Test = model<Test>('Test', testSchema, 'tests');
