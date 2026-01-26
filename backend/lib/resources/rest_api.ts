import { Construct } from "constructs";
import {
  AuthorizationType,
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
import { FUNCTION_INTEGRATIONS, FunctionIntegration } from "../../src/functions-declarations";
import { FUNCTIONS_PATH } from "../../environment";

type AppRoute = {
  routeName: string,
  subRoutes?: AppRoute[],
  integrations?: {
    method: 'POST' | 'PUT' | 'OPTIONS' | 'GET' | 'DELETE' | 'PATCH',
    functionPath: string
  }[]
}

export class RestApiGateway extends Construct {
  apiGateway: RestApi;
  authorizer: CognitoUserPoolsAuthorizer;
  methods: Method[] = [];
  timeout: Duration = Duration.seconds(API_GATEWAY_TIMEOUT)
  createApiMethods() {
    this.apiGateway.root.addMethod('GET');
    const routes: string[] = [...new Set(FUNCTION_INTEGRATIONS.map(el => el.apiRoute.toLowerCase().split('/')[0]))]
    routes.forEach((route: string) => {
      const integrations = FUNCTION_INTEGRATIONS.filter(el => el.apiRoute.split('/')[0] == route)
      let nestedStack = new RouteConstruct(this, route, {
        apiId: this.apiGateway.restApiId,
        rootResourceId: this.apiGateway.restApiRootResourceId,
        authorizer: this.authorizer,
        integrations: integrations,
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
  integrations: FunctionIntegration[],
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
        new LambdaConstruct(this, functionName, FUNCTIONS_PATH + functionPath, this.role, {
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
      this.addMethod(resource, int.functionPath, int.method)
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