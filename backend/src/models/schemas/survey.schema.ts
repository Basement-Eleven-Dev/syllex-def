import { InferSchemaType, model, Schema } from "mongoose";

const surveyFieldSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'number', 'radio', 'checkbox'], required: true },
    label: { type: String, required: true },
    description: { type: String },
    required: { type: Boolean, default: false },
    options: { type: [String] }, // Used for radio/checkbox
    min: { type: Number },
    max: { type: Number }
});

const surveySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    isAnonymous: { type: Boolean, default: false },
    fields: { type: [surveyFieldSchema], default: [] }
}, {
    timestamps: true
});

type Survey = InferSchemaType<typeof surveySchema>;

export const Survey = model<Survey>('Survey', surveySchema, 'surveys');
