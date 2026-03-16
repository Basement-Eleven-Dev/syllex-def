import { InferSchemaType, model, Schema } from "mongoose";

const materialSchema = new Schema({
    name: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    url: { type: String },
    type: {
        type: String,
        enum: ['file', 'folder'],
        required: true,
    },
    extension: { type: String },
    isMap: { type: Boolean },
    aiGenerated: { type: Boolean },
    vectorized: { type: Boolean },
    extractedTextFileUrl: { type: String },
    generatedFrom: { type: Schema.Types.ObjectId },
    byteSize: { type: Number },
    content: { type: [Schema.Types.ObjectId] }
}, {
    timestamps: true
})

type Material = InferSchemaType<typeof materialSchema>;

export const Material = model<Material>('Material', materialSchema, 'materials');