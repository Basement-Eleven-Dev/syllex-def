import { InferSchemaType, model, Schema } from "mongoose";

const surveyResponseSchema = new Schema({
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
    respondentId: { type: Schema.Types.ObjectId, ref: 'User' },
    answers: { type: Schema.Types.Mixed, required: true }, // Key-value object mapping field.id to answer
    submittedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

type SurveyResponse = InferSchemaType<typeof surveyResponseSchema>;

export const SurveyResponse = model<SurveyResponse>('SurveyResponse', surveyResponseSchema, 'survey_responses');
