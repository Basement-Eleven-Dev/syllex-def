import { Duration } from "aws-cdk-lib";
import { CfnUserPoolGroup, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
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
            userPool: this.cognitoPool,
            idTokenValidity: Duration.days(1),
            accessTokenValidity: Duration.days(1),
            refreshTokenValidity: Duration.days(300)
        })
        new CfnUserPoolGroup(this, 'StudentGroup', {
            userPoolId: this.cognitoPool.userPoolId,
            groupName: 'students',
            description: 'Users with student privileges'
        });
        new CfnUserPoolGroup(this, 'TeacherGroup', {
            userPoolId: this.cognitoPool.userPoolId,
            groupName: 'teachers',
            description: 'Users with techer privileges'
        });
    }
}