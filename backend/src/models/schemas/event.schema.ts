import { InferSchemaType, model, Schema } from "mongoose";

const eventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type Event = InferSchemaType<typeof eventSchema>;

export const Event = model<Event>('Event', eventSchema, 'events');
