import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { LAMBDA_ROLE_NAME } from "../../environment";

export class DefaultLambdaRole extends Construct {
  role: Role;
  constructor(scope: Construct, name: string) {
    super(scope, name);
    this.role = new Role(scope, LAMBDA_ROLE_NAME, {
      roleName: LAMBDA_ROLE_NAME,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });
    this.addPolicies();
  }
  addPolicies() {
    this.role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: [
          "secretsmanager:GetSecretValue",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3:*",
          "textract:DetectDocumentText",
          "textract:StartDocumentTextDetection",
          "textract:GetDocumentTextDetection",
          "lambda:InvokeFunction",
          "cognito-idp:*",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "ses:SendEmail",
        ],
      })
    );
  }
}
