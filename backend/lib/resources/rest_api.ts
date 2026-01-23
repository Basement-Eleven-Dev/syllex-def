import { Construct } from "constructs";
import {
  AuthorizationType,
  Authorizer,
  CognitoUserPoolsAuthorizer,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { STAGE_NAME } from "../../environment";
import { LambdaConstruct } from "./lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { getFunctionDetails } from "./functions";
import { Duration } from "aws-cdk-lib";
import { API_GATEWAY_TIMEOUT } from "../../src/_helpers/config/env";

export class RestApiGateway extends Construct {
  apiGateway: RestApi;
  authorizer: CognitoUserPoolsAuthorizer;
  createFunctions() {
    getFunctionDetails().forEach((f) => {
      this.apiGateway.root.addResource(f.functionName).addMethod(
        "POST",
        new LambdaIntegration(
          new LambdaConstruct(this, f.functionName, f.path, this.role, {
            AI_GRADING_QUEUE_URL: this.queueUrl,
            INDEXING_QUEUE_URL: this.indexingQueueUrl,
          }).lambda,
          {
            timeout: Duration.seconds(API_GATEWAY_TIMEOUT),
          }
        ),
        this.authorizer
          ? {
              authorizer: this.authorizer,
              authorizationType: AuthorizationType.COGNITO,
            }
          : {}
      );
    });
  }
  constructor(
    scope: Construct,
    name: string,
    private cognitoPool: UserPool,
    private role: Role,
    private queueUrl: string,
    private indexingQueueUrl: string
  ) {
    super(scope, name);
    this.apiGateway = new RestApi(scope, name + "API", {
      restApiName: name + "API",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowHeaders: ["*"],
        allowMethods: ["*"],
      },
      deployOptions: {
        stageName: STAGE_NAME,
      },
      endpointTypes: [EndpointType.REGIONAL],
    });

    this.authorizer = new CognitoUserPoolsAuthorizer(
      scope,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [this.cognitoPool],
      }
    );
    this.createFunctions();
  }
}
