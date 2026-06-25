import middy from "@middy/core";
import httpResponseSerializer from "@middy/http-response-serializer";
import { Context, Handler } from "aws-lambda";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { getCurrentUser } from "./getAuthCognitoUser";
import { AUTHORIZED_API_HEADERS } from "../env";
import { mongo, Types } from "mongoose";
import { User } from "../models/schemas/user.schema";
import { randomUUID } from "crypto";
import {
  getRequestContext,
  runWithRequestContext,
  RequestContextStore,
} from "./logging/requestContext";
import { flushRequestLog } from "./logging/activityLogger";

declare module "aws-lambda" {
  interface Context {
    user?: User | null;
    subjectId?: Types.ObjectId;
    language?: string;
  }
}

/**
 * Middleware di logging: copre AUTOMATICAMENTE ogni Lambda che passa da qui.
 * - `before`: popola lo store (già attivo via storage.run) con i dati dell'utente.
 * - `after` / `onError`: scarica a DB l'evento HTTP + gli eventi AI bufferizzati.
 * Tutto best-effort: non rompe né rallenta la risposta.
 */
const activityLogMiddleware = (): middy.MiddlewareObj => {
  const buildHttp = (request: any, status: "success" | "error") => {
    const store = getRequestContext();
    const event = request.event ?? {};
    const headers = event.headers ?? {};
    const rc = event.requestContext ?? {};
    const startedAt = store?.startedAt ?? new Date();
    const httpMethod = event.httpMethod ?? rc.httpMethod;
    const route = rc.resourcePath ?? event.resource;
    const error = request.error as any;

    return {
      action:
        httpMethod && route ? `${httpMethod} ${route}` : route || "unknown",
      route,
      httpMethod,
      functionName: request.context?.functionName,
      startedAt,
      durationMs: Date.now() - startedAt.getTime(),
      status,
      httpStatusCode:
        request.response?.statusCode ?? error?.statusCode ?? error?.status,
      errorType: error?.name,
      errorMessage: error?.message,
      rateLimited: error?.status === 429 || error?.statusCode === 429,
      userAgent: headers["User-Agent"] || headers["user-agent"],
      appVersion: headers["X-App-Version"] || headers["x-app-version"],
      stage: process.env.STAGE,
    };
  };

  return {
    before: async (request) => {
      // Lo store è già attivo (creato in runWithRequestContext): lo popoliamo.
      const store = getRequestContext();
      if (store) {
        store.userId = request.context?.user?._id as Types.ObjectId | undefined;
        store.userEmail = request.context?.user?.email;
        store.userRole = request.context?.user?.role;
        store.organizationId = request.context?.user
          ?.organizationIds?.[0] as Types.ObjectId | undefined;
        store.subjectId = request.context?.subjectId;
      }
    },
    after: async (request) => {
      await flushRequestLog(getRequestContext(), buildHttp(request, "success"));
    },
    onError: async (request) => {
      await flushRequestLog(getRequestContext(), buildHttp(request, "error"));
    },
  };
};

/**
 * Crea uno store fresco per l'invocazione e avvolge l'intero handler middy in
 * storage.run, così il contesto (chi/traceId/buffer AI) è isolato e sopravvive
 * a tutti gli await interni, anche con richieste concorrenti.
 */
const withRequestContext =
  (middyHandler: Handler): Handler =>
  (event: any, context: any, callback: any) => {
    const store: RequestContextStore = {
      traceId: context?.awsRequestId || randomUUID(),
      requestId: context?.awsRequestId,
      startedAt: new Date(),
      aiEvents: [],
    };
    return runWithRequestContext(store, () =>
      middyHandler(event, context, callback),
    );
  };

export const lambdaRequest = (handler: Handler) => {
  const middyHandler = middy(handler)
    .use({
      before: async (request) => {
        const subjectIdHeader =
          request.event.headers["Subject-Id"] ||
          request.event.headers["subject-id"];
        request.context.subjectId = subjectIdHeader
          ? new mongo.ObjectId(subjectIdHeader as string)
          : undefined;
        request.context.user = await getCurrentUser(request.event);

        const langHeader =
          request.event.headers["Accept-Language"] ||
          request.event.headers["accept-language"] ||
          "it";
        const cleanLang = String(langHeader)
          .split(",")[0]
          .split("-")[0]
          .trim()
          .toLowerCase();
        request.context.language = cleanLang || "it";
      },
    })
    .use(activityLogMiddleware())
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
    .use(
      cors({
        origin: "*",
        headers: AUTHORIZED_API_HEADERS.join(","),
      }),
    )
    .use(httpErrorHandler());

  return withRequestContext(middyHandler as unknown as Handler);
};

export const lambdaPublicRequest = (handler: Handler) => {
  const middyHandler = middy(handler)
    .use(activityLogMiddleware())
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
    .use(
      cors({
        origin: "*",
        headers: AUTHORIZED_API_HEADERS.join(","),
      }),
    )
    .use(httpErrorHandler());

  return withRequestContext(middyHandler as unknown as Handler);
};
