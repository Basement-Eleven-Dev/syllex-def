import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from "aws-lambda";
type HeadersType = {
  [header: string]: boolean | number | string;
};

export type CorsEnabledAPIGatewayProxyResult = Omit<
  APIGatewayProxyResult,
  "headers"
> & {
  headers: HeadersType & { "Access-Control-Allow-Origin": "*" };
};

export const generateLambdaResponse = (
  res: APIGatewayProxyResult
): CorsEnabledAPIGatewayProxyResult => {
  return {
    ...res,
    body: res.body,
    headers: {
      ...res.headers,
      "Access-Control-Allow-Origin": "*",
    },
  };
};

export type CustomHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<any>,
  response: any
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => void;

export class Res {
  status(s: number) {
    this._status = s;
    return this;
  }
  json(body: any) {
    return generateLambdaResponse({
      statusCode: this._status,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
  setHeader(key: string, value: string) {
    this._headers[key] = value;
  }
  send(body: string) {
    return generateLambdaResponse({
      statusCode: this._status,
      body: body,
      headers: this._headers,
    });
  }
  constructor(
    private _status: number = 200,
    private _headers: { [key: string]: string } = {}
  ) {}
}
