import "dotenv/config"; // Load .env before anything else
import express, { Request, Response } from "express";
import cors from "cors";
import { FUNCTION_INTEGRATIONS, FunctionIntegration } from "../lib/resources/api/functions-declarations.config";
import { FUNCTIONS_PATH } from "../environment";
import { canInvoke } from "../src/_request-validators/_helpers";
const PORT = 3000;
const app = express();
// Use raw text parsing because Middy's jsonBodyParser
// expects the event.body to be a string, not an object.
app.use(express.text({ type: "application/json", limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const testRoute: FunctionIntegration = {
  apiRoute: 'execute_spot',
  functionPath: '_test/local_test.ts',
  role: 'open',
  method: 'post'
};

[...FUNCTION_INTEGRATIONS, testRoute].forEach((integration) => {
  const { apiRoute, functionPath, method, role } = integration;

  // Converts 'teachers/{teacherId}/subjects' -> 'teachers/:teacherId/subjects'
  const expressPath = `/${apiRoute.replace(/{/g, ":").replace(/}/g, "")}`;

  const httpMethod = method;

  app[httpMethod](expressPath, async (req: Request, res: Response) => {
    try {
      if (role != "open") {
        let token = req.headers.authorization?.split(" ")[1];
        let cognitoGroup: "students" | "teachers" | undefined =
          role == "teacher"
            ? "teachers"
            : role == "student"
              ? "students"
              : undefined;
        let isAuthorized = await canInvoke(token, cognitoGroup);
        if (!isAuthorized) {
          res.status(403).send("unauthorized");
          return;
        }
      }
      // 1. Dynamic Import (Assumes paths are relative to this file)
      const { handler } = await import(`../${FUNCTIONS_PATH + functionPath}`);
      console.log(req.originalUrl)
      // 2. Construct Lambda Proxy Event
      const event = {
        body: req.body, // This will be a string due to express.text()
        headers: req.headers,
        pathParameters: req.params,
        queryStringParameters: req.query,
        httpMethod: method,
        path: req.path,
        requestContext: {
          resourcePath: apiRoute,
          httpMethod: method,
          path: req.originalUrl,
          stage: "",
          domainName: "localhost:" + PORT
        },
      };

      // 3. Invoke Handler
      const result = await handler(event, {} as any);

      // 4. Handle Lambda Response
      res
        .status(result.statusCode || 200)
        .set(result.headers || {})
        .send(result.body);
    } catch (error) {
      console.error(`❌ Local Execution Error [${method} ${apiRoute}]:`, error);
      res.status(500).send({ error: error });
    }
  });
});


app.listen(PORT, () => {
  console.log(`\n✅ Local Environment Ready`);
  console.table(
    FUNCTION_INTEGRATIONS.map((l) => ({ Method: l.method, Route: l.apiRoute })),
  );
  console.log(`Listening at http://localhost:${PORT}\n`);
});
