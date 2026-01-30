import middy from "@middy/core";
import httpResponseSerializer from "@middy/http-response-serializer";
import { Handler } from "aws-lambda";
import cors from '@middy/http-cors';
import httpErrorHandler from "@middy/http-error-handler";

export const lambdaRequest = (handler: Handler) => {
  return middy(handler)
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