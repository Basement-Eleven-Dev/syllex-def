import { InferSchemaType, model, Schema } from "mongoose";

const reportSchema = new Schema({
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId },
    comment: { type: String, required: true },
    url: { type: String },
    userAgent: { type: String },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    }
}, {
    timestamps: true
});

type Report = InferSchemaType<typeof reportSchema>;

export const Report = model<Report>('Report', reportSchema, 'reports');
