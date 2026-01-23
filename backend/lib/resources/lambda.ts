import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { BUCKET_NAME, STAGE_NAME } from "../../environment";

const withSecretLayerEnvironmentVariables = (env: {
  [key: string]: string;
}): {
  [key: string]: string;
} => {
  return {
    ...env,
    PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED: "true",
    PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE: "1000",
    PARAMETERS_SECRETS_EXTENSION_HTTP_PORT: "2773",
    PARAMETERS_SECRETS_EXTENSION_LOG_LEVEL: "info",
    PARAMETERS_SECRETS_EXTENSION_MAX_CONNECTIONS: "3",
    SECRETS_MANAGER_TIMEOUT_MILLIS: "0",
    SECRETS_MANAGER_TTL: "300",
    SSM_PARAMETER_STORE_TIMEOUT_MILLIS: "0",
    SSM_PARAMETER_STORE_TTL: "300",
  };
};
const default_lambda_runtime: lambda.Runtime = lambda.Runtime.NODEJS_22_X;
const default_lambda_architecture: lambda.Architecture =
  lambda.Architecture.X86_64;

export class LambdaConstruct extends Construct {
  lambda: NodejsFunction;
  constructor(
    scope: Construct,
    name: string,
    fileName: string,
    role: Role,
    additionalEnvironment: { [k: string]: string } = {}
  ) {
    super(scope, name);
    this.lambda = new NodejsFunction(this, name, {
      runtime: default_lambda_runtime,
      timeout: Duration.seconds(600), //optimize
      memorySize: 1024,
      paramsAndSecrets: lambda.ParamsAndSecretsLayerVersion.fromVersionArn(
        "arn:aws:lambda:eu-south-1:325218067255:layer:AWS-Parameters-and-Secrets-Lambda-Extension:16"
      ),
      architecture: default_lambda_architecture,
      handler: "index.handler",
      bundling: {
        minify: true,
      },
      environment: withSecretLayerEnvironmentVariables({
        ...additionalEnvironment,
        STAGE: STAGE_NAME,
        BUCKET_NAME: BUCKET_NAME,
        DATABASE_CONNECTION: process.env.DATABASE_CONNECTION || "",
      }),
      role: role,
      entry: fileName,
    });
  }
}
