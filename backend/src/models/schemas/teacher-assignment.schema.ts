import { InferSchemaType, model, Schema } from "mongoose";

const teacherAssignmentSchema = new Schema({
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    classId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type TeacherAssignment = InferSchemaType<typeof teacherAssignmentSchema>;

export const TeacherAssignment = model<TeacherAssignment>('TeacherAssignment', teacherAssignmentSchema, 'teacher_assignments');
