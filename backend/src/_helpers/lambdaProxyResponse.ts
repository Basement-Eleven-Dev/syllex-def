import middy from "@middy/core";
import httpResponseSerializer from "@middy/http-response-serializer";
import { Context, Handler } from "aws-lambda";
import cors from '@middy/http-cors';
import httpErrorHandler from "@middy/http-error-handler";
import { getCurrentUser } from "./getAuthCognitoUser";
import { User } from "../models/user";
import { ObjectId } from "mongodb";

declare module 'aws-lambda' {
  interface Context {
    user?: User | null;
    subjectId?: ObjectId
  }
}

export const lambdaRequest = (handler: any) => {
  return middy(handler)
    .use({
      before: async (request) => {
        request.context.subjectId = request.event.headers['Subject-Id'] ? new ObjectId(request.event.headers['Subject-Id'] as string) : undefined,
          request.context.user = await getCurrentUser(request.event);
      }
    })
    .use(
      httpResponseSerializer({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: 'application/json',
      })
    )
    .use(httpErrorHandler())
    .use(cors({ origin: "*" }));
};