import { Construct } from "constructs";
import {
  Authorizer,
  EndpointType,
  Method,
  RestApi,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { LambdaConstruct } from "../lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import { API_GATEWAY_TIMEOUT } from "../../../src/env";
import { AppRole, FUNCTION_INTEGRATIONS } from "./functions-declarations.config";
import { RouteConstruct } from "./api_route";


export class RestApiGateway extends Construct {
  apiGateway: RestApi;
  loggedAuthorizer?: Authorizer;
  studentAuthorizer?: Authorizer;
  teacherAuthorizer?: Authorizer;
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
        authorizers: {
          logged: this.loggedAuthorizer,
          teacher: this.teacherAuthorizer,
          student: this.studentAuthorizer
        },
        integrations: integrations
      })
      this.methods.concat(nestedStack.methods);
    });
  }
  createLoggedAuthorizer() {
    if (FUNCTION_INTEGRATIONS.some(el => el.role == 'logged')) this.loggedAuthorizer = new TokenAuthorizer(
      this,
      "CognitoLoggedAuthorizer",
      {
        handler: new LambdaConstruct(this, 'loggedAuthorizer', 'src/_request-validators/logged-validator.ts', this.defaultRole, {
          COGNITO_POOL_ID: this.cognitoPool.userPoolId,
          COGNITO_CLIENT_ID: this.cognitoClient.userPoolClientId,
        }).lambda,
        identitySource: 'method.request.header.Authorization', // Where the token lives
        resultsCacheTtl: Duration.minutes(5),
      }
    );
  }
  createStudentAuthorizer() {
    if (FUNCTION_INTEGRATIONS.some(el => el.role == 'student')) this.studentAuthorizer = new TokenAuthorizer(
      this,
      "CognitoStudentAuthorizer",
      {
        handler: new LambdaConstruct(this, 'studentAuthorizer', 'src/_request-validators/student-validator.ts', this.defaultRole, {
          COGNITO_POOL_ID: this.cognitoPool.userPoolId,
          COGNITO_CLIENT_ID: this.cognitoClient.userPoolClientId,
        }).lambda,
        identitySource: 'method.request.header.Authorization', // Where the token lives
        resultsCacheTtl: Duration.minutes(5),
      }
    );
  }
  createTeacherAuthorizer() {
    if (FUNCTION_INTEGRATIONS.some(el => el.role == 'teacher')) this.teacherAuthorizer = new TokenAuthorizer(
      this,
      "CognitoTeacherAuthorizer",
      {
        handler: new LambdaConstruct(this, 'teacherAuthorizer', 'src/_request-validators/teacher-validator.ts', this.defaultRole, {
          COGNITO_POOL_ID: this.cognitoPool.userPoolId,
          COGNITO_CLIENT_ID: this.cognitoClient.userPoolClientId,
        }).lambda,
        identitySource: 'method.request.header.Authorization', // Where the token lives
        resultsCacheTtl: Duration.minutes(5),
      }
    );
  }
  createAuthorizers() {
    this.createStudentAuthorizer();
    this.createTeacherAuthorizer();
    this.createLoggedAuthorizer();
  }
  constructor(
    scope: Construct,
    name: string,
    private cognitoPool: UserPool,
    private cognitoClient: UserPoolClient,
    private defaultRole: Role
  ) {
    super(scope, name);
    this.apiGateway = new RestApi(this, name + "API", {
      restApiName: name + "API",
      deploy: false,
      cloudWatchRole: true,
      endpointTypes: [EndpointType.REGIONAL],
    });
    this.createAuthorizers();
    this.createApiMethods();
  }
}

