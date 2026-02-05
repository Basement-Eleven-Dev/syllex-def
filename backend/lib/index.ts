import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGateway } from "./resources/api/rest_api";
import { CognitoUserPool } from "./resources/cognito";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import {
  API_NAME,
  BUCKET_NAME,
  POOL_NAME,
} from "../environment";
import { DefaultLambdaRole } from "./resources/roles";
import { DeployStack } from "./resources/api/api_stage";
import { MainBucket } from "./resources/bucket";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    let role = new DefaultLambdaRole(this, "role_default_v2").role;
    let bucket = new MainBucket(this, BUCKET_NAME, role).bucket;
    let cognito = new CognitoUserPool(this, POOL_NAME);
    let apiGatewayInstance = new RestApiGateway(
      this,
      API_NAME,
      cognito.cognitoPool,
      cognito.cognitoPoolClient,
      role
    );
    new DeployStack(this, { restApiId: apiGatewayInstance.apiGateway.restApiId, methods: apiGatewayInstance.methods })

  }
}

