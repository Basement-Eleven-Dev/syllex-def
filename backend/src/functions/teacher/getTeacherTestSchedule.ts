import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { month, year, classId, subjectId } = JSON.parse(req.body || "{}");

  if (
    !month ||
    !year ||
    !classId ||
    !ObjectId.isValid(classId) ||
    !subjectId ||
    !ObjectId.isValid(subjectId)
  ) {
    return res.status(400).json({
      message: "Mese, anno, ID classe e ID materia sono obbligatori.",
    });
  }

  const classObjectId = new ObjectId(classId);
  const subjectObjectId = new ObjectId(subjectId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const schedule = await db
      .collection("testAssignments")
      .aggregate([
        {
          $match: {
            classId: classObjectId,
            availableFrom: { $gte: startDate, $lt: endDate },
          },
        },

        {
          $lookup: {
            from: "tests",
            localField: "testId",
            foreignField: "_id",
            as: "testInfo",
          },
        },
        { $unwind: "$testInfo" },

        { $match: { "testInfo.subjectId": subjectObjectId } },

        {
          $lookup: {
            from: "classes",
            localField: "classId",
            foreignField: "_id",
            as: "classInfo",
          },
        },
        { $unwind: "$classInfo" },
        {
          $lookup: {
            from: "courses",
            localField: "classInfo.courseId",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        { $sort: { availableFrom: 1 } },
        {
          $project: {
            _id: 0,
            testId: "$testInfo._id",
            assignmentId: "$_id",
            testTitle: "$testInfo.title",
            courseName: "$courseInfo.name",
            className: "$classInfo.name",
            scheduledDate: "$availableFrom",
            durationMinutes: "$durationMinutes",
          },
        },
      ])
      .toArray();

    return res.status(200).json({ schedule });
  } catch (error) {
    console.error("Errore nel recupero del calendario dei test:", error);
    return res.status(500).json({ message: "Errore del server." });
  }
};
