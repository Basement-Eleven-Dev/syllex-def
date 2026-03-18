import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { notifyStudentsIfEnabled } from "../../_helpers/email/notifyStudents";
import { newCommunicationEmail } from "../../_helpers/email/emailTemplates";
import { Communication } from "../../models/schemas/communication.schema";

const createCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationData = JSON.parse(request.body || "{}");

  await connectDatabase();

  const newCommunication: any = {
    title: communicationData.title,
    content: communicationData.content,
    classIds: communicationData.classIds.map((id: string) => new Types.ObjectId(id)),
    materialIds: communicationData.materialIds.map(
      (id: string) => new Types.ObjectId(id),
    ),
    subjectId: context.subjectId!,
    teacherId: context.user?._id,
    createdAt: new Date(),
  };

  const result = await Communication.create(newCommunication);

  // Notifica email agli studenti (asincrono, non blocca la risposta)
  const teacherName = `${context.user?.firstName || ""} ${context.user?.lastName || ""}`.trim();
  const { subject, html } = newCommunicationEmail({
    teacherName,
    communicationTitle: communicationData.title,
    preview: communicationData.content?.substring(0, 200),
  });

  notifyStudentsIfEnabled({
    teacher: context.user,
    preference: "newCommunication",
    classIds: newCommunication.classIds,
    subject,
    html,
  });

  return {
    communication: result,
  };
};

export const handler = lambdaRequest(createCommunication);
