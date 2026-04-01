import middy from "@middy/core";
import httpResponseSerializer from "@middy/http-response-serializer";
import { Context, Handler } from "aws-lambda";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { getCurrentUser } from "./getAuthCognitoUser";
import { AUTHORIZED_API_HEADERS } from "../env";
import { mongo, Types } from "mongoose";
import { User } from "../models/schemas/user.schema";

declare module "aws-lambda" {
  interface Context {
    user?: User | null;
    subjectId?: Types.ObjectId;
  }
}

export const lambdaRequest = (handler: Handler) => {
  return middy(handler)
    .use({
      before: async (request) => {
        const subjectIdHeader =
          request.event.headers["Subject-Id"] ||
          request.event.headers["subject-id"];
        request.context.subjectId = subjectIdHeader
          ? new mongo.ObjectId(subjectIdHeader as string)
          : undefined;
        request.context.user = await getCurrentUser(request.event);
      },
    })
    .use(
      httpResponseSerializer({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: "application/json",
      }),
    )
    .use(httpErrorHandler())
    .use(
      cors({
        origin: "*",
        headers: AUTHORIZED_API_HEADERS.join(','),
      }),
    );
};

export const lambdaPublicRequest = (handler: Handler) => {
  return middy(handler)
    .use(
      httpResponseSerializer({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: "application/json",
      }),
    )
    .use(httpErrorHandler())
    .use(
      cors({
        origin: "*",
        headers: AUTHORIZED_API_HEADERS.join(','),
      }),
    );
};

