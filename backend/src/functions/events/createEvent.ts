import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { notifyStudentsIfEnabled } from "../../_helpers/email/notifyStudents";
import { newEventEmail } from "../../_helpers/email/emailTemplates";

const createEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventData = JSON.parse(request.body || "{}");

  const db = await getDefaultDatabase();
  const eventsCollection = db.collection("events");

  const newEvent = {
    title: eventData.title,
    description: eventData.description || "",
    date: new Date(eventData.date),
    time: eventData.time || null,
    teacherId: context.user?._id,
    subjectId: context.subjectId!,
    createdAt: new Date(),
  };

  const result = await eventsCollection.insertOne(newEvent);

  // Notifica email: recupera le classi assegnate a questa materia per questo docente
  const teacherName = `${context.user?.firstName || ""} ${context.user?.lastName || ""}`.trim();
  const eventDate = new Date(eventData.date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const { subject, html } = newEventEmail({
    teacherName,
    eventTitle: eventData.title,
    eventDate,
    eventTime: eventData.time || undefined,
  });

  // Recupera le classi assegnate al docente per la materia
  const assignments = await db
    .collection("classes")
    .find({
      "assignments.subjectId": new ObjectId(context.subjectId!),
      "assignments.teacherId": context.user?._id,
    })
    .toArray();

  const classIds = assignments.map((c) => c._id);

  notifyStudentsIfEnabled({
    teacher: context.user,
    preference: "newEvent",
    classIds,
    subject,
    html,
  });

  return {
    event: {
      ...newEvent,
      _id: result.insertedId,
    },
  };
};

export const handler = lambdaRequest(createEvent);
