import { Duration } from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { INDEXING_QUEUE_NAME } from "../../../environment";
import { LambdaConstruct } from "../lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Role } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class VectorizingResources extends Construct {
    queue: Queue
    lambda: NodejsFunction
    constructor(scope: Construct, name: string, role: Role) {
        super(scope, name);
        this.queue = new Queue(this, "indexing-background-queue", {
            queueName: INDEXING_QUEUE_NAME,
            visibilityTimeout: Duration.seconds(600),
        });
        this.lambda = new LambdaConstruct(
            this,
            "indexing-background-lambda",
            "src/_triggers/backgroundVectorize.ts",
            role,
            {}
        ).lambda;
        this.lambda.addEventSource(
            new SqsEventSource(this.queue, {
                maxConcurrency: 5,
                batchSize: 1, //important, multiple non gestito
            })
        );
    }
}