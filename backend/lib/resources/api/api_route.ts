import { Construct } from "constructs";
import {
    AuthorizationType,
    Authorizer,
    CfnMethod,
    IResource,
    IRestApi,
    LambdaIntegration,
    Method,
    MockIntegration,
    PassthroughBehavior,
    RequestValidator,
    RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Duration, NestedStack, NestedStackProps } from "aws-cdk-lib";
import { AppRole, FunctionIntegration } from "./functions-declarations.config";
import { Role } from "aws-cdk-lib/aws-iam";
import { FUNCTIONS_PATH } from "../../../environment";
import { LambdaConstruct } from "../lambda";
import { DefaultLambdaRole } from "../roles";
import { API_GATEWAY_TIMEOUT } from "../../../src/env";
import { writeFile } from "fs/promises";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

export interface RouteConstructProps extends NestedStackProps {
    apiId: string,
    rootResourceId: string,
    integrations: FunctionIntegration[],
    authorizers: {
        logged?: Authorizer,
        teacher?: Authorizer,
        student?: Authorizer
    },
    validator?: RequestValidator,
    cognitoPoolId: string,
    cognitoClientId: string

}

export class RouteConstruct extends NestedStack {
    role: Role;
    api: IRestApi
    public readonly methods: Method[] = []

    private getAuthorizer(appRole: AppRole): Authorizer | undefined {
        if (appRole == 'logged') return this.props.authorizers.logged!;
        if (appRole == 'teacher') return this.props.authorizers.teacher!;
        if (appRole == 'student') return this.props.authorizers.student!;
        return undefined
    }

    private addOptionsMethod(apiResource: IResource) {
        let apiMethod = apiResource.addMethod('OPTIONS', new MockIntegration({
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'*'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH'",
                },
            }],
            passthroughBehavior: PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
        }))
        const methodResource = apiMethod.node.findChild("Resource") as CfnMethod
        methodResource.methodResponses = [{
            statusCode: '200',
            responseModels: {
                'application/json': 'Empty'
            },
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': true,
                'method.response.header.Access-Control-Allow-Methods': true,
                'method.response.header.Access-Control-Allow-Credentials': true,
                'method.response.header.Access-Control-Allow-Origin': true,
            },
        }]
        this.methods.push(apiMethod)

    }

    private addMethod(resource: IResource, functionPath: string, method: string, appRole: AppRole, layer?: { name: string, arn: string }) {
        let functionName = functionPath.split('.ts')[0].replace(/\//g, "-");
        let apiMethod = resource.addMethod(
            method,
            new LambdaIntegration(
                new LambdaConstruct(this, functionName, FUNCTIONS_PATH + functionPath, this.role, {
                    COGNITO_POOL_ID: this.props.cognitoPoolId,
                    COGNITO_CLIENT_ID: this.props.cognitoClientId
                },
                    layer ? [LayerVersion.fromLayerVersionArn(this, layer.name, layer.arn)] : []
                ).lambda,
                {

                    timeout: Duration.seconds(API_GATEWAY_TIMEOUT),
                }
            ),
            (this.getAuthorizer(appRole))
                ? {
                    authorizer: this.getAuthorizer(appRole),
                    authorizationType: AuthorizationType.CUSTOM,
                }
                : {}
        )
        this.methods.push(apiMethod)
    }

    private createMethods(integrations: FunctionIntegration[]) {
        let uniqueRoutes = [...new Set(integrations.map(el => el.apiRoute))];
        uniqueRoutes.forEach(int => {
            let resource = this.api.root;
            int.split('/').forEach(piece => resource = resource.getResource(piece) || resource.addResource(piece));
            this.addOptionsMethod(resource)
        })
        integrations.forEach(int => {
            let resource = this.api.root;
            int.apiRoute.split('/').forEach(piece => resource = resource.getResource(piece) || resource.addResource(piece));
            this.addMethod(resource, int.functionPath, int.method, int.role, int.extensionLayer)
        })
    }

    constructor(scope: Construct, private name: string, public props: RouteConstructProps) {
        super(scope, name);
        this.role = new DefaultLambdaRole(this, this.name + 'Role').role
        this.api = RestApi.fromRestApiAttributes(this, 'RestApi', {
            restApiId: this.props.apiId,
            rootResourceId: this.props.rootResourceId,
        });
        this.createMethods(this.props.integrations)
    }
}