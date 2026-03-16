import { InferSchemaType, model, Schema } from "mongoose";

const classSchema = new Schema({
    name: { type: String, required: true },
    year: { type: Number, required: true },
    students: { type: [Schema.Types.ObjectId], default: [] },
    organizationId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type Class = InferSchemaType<typeof classSchema>;

export const Class = model<Class>('Class', classSchema, 'classes');
