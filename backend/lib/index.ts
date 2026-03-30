import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGateway } from "./resources/api/rest_api";
import { CognitoUserPool } from "./resources/cognito";
import {
  API_NAME,
  LAMBDA_ROLE_NAME,
  POOL_NAME,
} from "../environment";
import { DefaultLambdaRole } from "./resources/roles";
import { DeployStack } from "./resources/api/api_stage";
import { VectorizingResources } from "./resources/background/vectorizingConstruct";
import { EmailResources } from "./resources/background/emailConstruct";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    let role = new DefaultLambdaRole(this, LAMBDA_ROLE_NAME).role;
    let cognito = new CognitoUserPool(this, POOL_NAME);
    let indexingTriggerStack = new VectorizingResources(this, 'material_background_vectorization', role);
    let emailStack = new EmailResources(this, 'bulk_email_background', role);
    let apiGatewayInstance = new RestApiGateway(
      this,
      API_NAME,
      cognito.cognitoPool,
      cognito.cognitoPoolClient,
      role,
      indexingTriggerStack.queue.queueUrl.toString(),
      emailStack.queue.queueUrl.toString()
    );
    new DeployStack(this, { restApiId: apiGatewayInstance.apiGateway.restApiId, methods: apiGatewayInstance.methods })
  }
}

