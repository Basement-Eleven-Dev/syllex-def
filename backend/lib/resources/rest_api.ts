import { Construct } from "constructs";
import {
  AuthorizationType,
  Authorizer,
  CfnMethod,
  CognitoUserPoolsAuthorizer,
  EndpointType,
  IResource,
  IRestApi,
  LambdaIntegration,
  Method,
  MockIntegration,
  PassthroughBehavior,
  RequestValidator,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { LambdaConstruct } from "./lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { Duration, NestedStack, NestedStackProps } from "aws-cdk-lib";
import { API_GATEWAY_TIMEOUT } from "../../src/_helpers/config/env";
import { DefaultLambdaRole } from "./roles";
import { FUNCTION_DECLARATIONS, AppRoute } from "../../src/functions-declarations";

export class RestApiGateway extends Construct {
  apiGateway: RestApi;
  authorizer: CognitoUserPoolsAuthorizer;
  methods: Method[] = [];
  timeout: Duration = Duration.seconds(API_GATEWAY_TIMEOUT)
  createApiMethods() {
    this.apiGateway.root.addMethod('GET');
    FUNCTION_DECLARATIONS.forEach((declarations: AppRoute) => {
      let nestedStack = new RouteConstruct(this, declarations.routeName, {
        apiId: this.apiGateway.restApiId,
        rootResourceId: this.apiGateway.restApiRootResourceId,
        authorizer: this.authorizer,
        routeDeclaration: declarations,
        queueUrl: this.queueUrl,
        indexingQueueUrl: this.indexingQueueUrl
      })
      this.methods.concat(nestedStack.methods);
    });
  }
  constructor(
    scope: Construct,
    name: string,
    private cognitoPool: UserPool,
    private queueUrl: string,
    private indexingQueueUrl: string
  ) {
    super(scope, name);
    this.apiGateway = new RestApi(scope, name + "API", {
      restApiName: name + "API",
      deploy: false,
      cloudWatchRole: true,
      endpointTypes: [EndpointType.REGIONAL],
    });

    this.authorizer = new CognitoUserPoolsAuthorizer(
      scope,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [this.cognitoPool],
      }
    );
    this.createApiMethods();
  }
}

export interface RouteConstructProps extends NestedStackProps {
  apiId: string,
  rootResourceId: string,
  routeDeclaration: AppRoute,
  authorizer?: CognitoUserPoolsAuthorizer,
  validator?: RequestValidator,
  queueUrl: string,
  indexingQueueUrl: string,

}

export class RouteConstruct extends NestedStack {
  role: Role;
  api: IRestApi
  public readonly methods: Method[] = []
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
  private addMethod(resource: IResource, functionPath: string, method: string) {
    let functionName = functionPath.split('.ts')[0].replace(/\//g, "-");
    let apiMethod = resource.addMethod(
      method,
      new LambdaIntegration(
        new LambdaConstruct(this, functionName, 'src/' + functionPath, this.role, {
          AI_GRADING_QUEUE_URL: this.props.queueUrl,
          INDEXING_QUEUE_URL: this.props.indexingQueueUrl,
        }).lambda,
        {
          timeout: Duration.seconds(API_GATEWAY_TIMEOUT),
        }
      ),
      this.props.authorizer
        ? {
          authorizer: this.props.authorizer,
          authorizationType: AuthorizationType.COGNITO,
        }
        : {}
    )
    this.methods.push(apiMethod)
  }
  private createMethods(methodDescriptions: AppRoute, resource: IResource) {
    let subResource = resource.addResource(methodDescriptions.routeName)
    if (methodDescriptions.integration) {

      this.addOptionsMethod(subResource);
      this.addMethod(subResource, methodDescriptions.integration.functionPath, methodDescriptions.integration.method)
    }
    methodDescriptions.subRoutes?.forEach(a => this.createMethods(a, subResource))
  }
  constructor(scope: Construct, private name: string, public props: RouteConstructProps) {
    super(scope, name);
    this.role = new DefaultLambdaRole(this, this.name + 'Role').role
    this.api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: this.props.apiId,
      rootResourceId: this.props.rootResourceId,
    });
    this.createMethods(this.props.routeDeclaration, this.api.root)
  }
}