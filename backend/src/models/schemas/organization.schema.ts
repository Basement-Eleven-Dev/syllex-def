import { InferSchemaType, model, Schema } from "mongoose";

const organizationSchema = new Schema({
    name: { type: String, required: true },
    logoUrl: { type: String },
    onboardingStatus: { type: String, enum: ['Configurata', 'Pendente'] },
    administrators: { type: [Schema.Types.ObjectId] }
}, {
    timestamps: true
})

type Organization = InferSchemaType<typeof organizationSchema>;

export const Organization = model<Organization>('Organization', organizationSchema, 'organizations');