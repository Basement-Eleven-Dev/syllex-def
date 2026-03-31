import { IUserPool, IUserPoolClient, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CognitoUserPool extends Construct {
    public readonly cognitoPool: IUserPool;
    public readonly cognitoPoolClient: IUserPoolClient;

    constructor(scope: Construct, name: string) {
        super(scope, name);
        this.cognitoPool = UserPool.fromUserPoolArn(this, name + 'Pool', 'arn:aws:cognito-idp:eu-south-1:851725509686:userpool/eu-south-1_w77iyt3xa')
        this.cognitoPoolClient = UserPoolClient.fromUserPoolClientId(this, name + 'Client', '4tc0qd18cvu46tbkccoi1nc12e')
    }
}