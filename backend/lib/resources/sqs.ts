import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { LambdaConstruct } from "./lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration } from "aws-cdk-lib";
import { BACKGROUND_CORRECTION_QUEUE_NAME, BACKGROUND_INDEXING_QUEUE_NAME } from "../../environment";

export class BackgroundFunctions extends Construct {
  sqs: Queue;
  lambda: NodejsFunction;
  queueUrl: string;

  indexingQueue: Queue;
  indexingLambda: NodejsFunction;
  indexingQueueUrl: string;

  constructor(scope: Construct, name: string, role: Role) {
    super(scope, name);
    this.sqs = new Queue(this, "correction-background-v2", {
      queueName: BACKGROUND_CORRECTION_QUEUE_NAME,
      visibilityTimeout: Duration.seconds(600),
    });
    this.lambda = new LambdaConstruct(
      this,
      "correction-background-lambda-v2",
      "src/background/processAIGrading.ts",
      role,
      {}
    ).lambda;
    this.lambda.addEventSource(
      new SqsEventSource(this.sqs, {
        maxConcurrency: 5,
        batchSize: 1,
      })
    );

    this.queueUrl = this.sqs.queueUrl;

    //BLOCCO PER LA FUNZIONE DI INDICIZZAZIONE
    this.indexingQueue = new Queue(this, "IndexingQueueV2", {
      queueName: BACKGROUND_INDEXING_QUEUE_NAME,
      visibilityTimeout: Duration.seconds(600),
    });
    this.indexingLambda = new LambdaConstruct(
      this,
      "indexing-background-lambda-v2",
      "src/background/indexMaterial.ts",
      role,
      {}
    ).lambda;
    this.indexingLambda.addEventSource(
      new SqsEventSource(this.indexingQueue, {
        maxConcurrency: 5,
        batchSize: 1,
      })
    );
    this.indexingQueueUrl = this.indexingQueue.queueUrl;
    this.sqs.grantSendMessages(role)
    this.indexingQueue.grantSendMessages(role)
  }
}
