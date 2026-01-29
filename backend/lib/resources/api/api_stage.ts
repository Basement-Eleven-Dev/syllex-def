import { AccessLogFormat, Deployment, LogGroupLogDestination, Method, MethodLoggingLevel, RestApi, Stage } from "aws-cdk-lib/aws-apigateway";
import * as crypto from 'crypto';
import { LogGroup } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { STAGE_NAME } from "../../../environment";

interface DeployStackProps extends cdk.NestedStackProps {
    readonly restApiId: string;

    readonly methods: Method[];
}

export class DeployStack extends cdk.NestedStack {
    constructor(scope: Construct, props: DeployStackProps) {
        super(scope, 'integ-restapi-import-DeployStack', props);
        const apiDefinitionHash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        const deployment = new Deployment(this, 'Deployment' + apiDefinitionHash, {
            api: RestApi.fromRestApiId(this, 'RestApi', props.restApiId),
        });
        for (const method of props.methods) {
            //nested stack
            deployment.node.addDependency(method);
        }
        //roba strana
        new Stage(this, STAGE_NAME, {
            deployment: deployment,
            loggingLevel: MethodLoggingLevel.INFO, // Enable Execution Logs (INFO for details, ERROR for errors only)

            // Enable Access Logging
            accessLogDestination: new LogGroupLogDestination(new LogGroup(this, 'ApiAccessLogs')),
            // Define the format for your access logs (JSON is highly recommended)
            accessLogFormat: AccessLogFormat.jsonWithStandardFields({
                ip: true,
                caller: true,
                user: true,
                requestTime: true,
                httpMethod: true,
                resourcePath: true,
                status: true,
                protocol: true,
                responseLength: true
            }),
            // Data tracing gives full request/response bodies in Execution Logs, use with caution in production due to cost/security
            dataTraceEnabled: true,
        });
    }
}
