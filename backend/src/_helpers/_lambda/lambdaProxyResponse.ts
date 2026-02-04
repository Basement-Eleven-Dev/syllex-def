import middy from "@middy/core";
import httpResponseSerializer from "@middy/http-response-serializer";
import { Context, Handler } from "aws-lambda";
import cors from '@middy/http-cors';
import httpErrorHandler from "@middy/http-error-handler";
import { getCurrentUser, User } from "../getAuthCognitoUser";

declare module 'aws-lambda' {
  interface Context {
    user?: User | null;
  }
}

export const lambdaRequest = (handler: any) => {
  return middy(handler)
    .use({
      before: async (request) => {
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