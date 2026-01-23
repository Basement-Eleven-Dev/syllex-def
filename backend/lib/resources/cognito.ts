import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CognitoUserPool extends Construct {
    public readonly cognitoPool: UserPool;
    public readonly cognitoPoolClient: UserPoolClient;

    constructor(scope: Construct, name: string) {
        super(scope, name);
        this.cognitoPool = new UserPool(this, name + 'Pool', {
            signInAliases: {
                email: true
            },
            passwordPolicy: {
                minLength: 8,
                requireDigits: false,
                requireLowercase: false,
                requireSymbols: false,
                requireUppercase: false
            }
        })
        this.cognitoPoolClient = new UserPoolClient(this, name + 'Client', {
            userPool: this.cognitoPool
        })
    }
}