import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { LambdaConstruct } from "./lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration } from "aws-cdk-lib";

export class BackgroundFunctions extends Construct {
  sqs: Queue;
  lambda: NodejsFunction;
  queueUrl: string;

  indexingQueue: Queue;
  indexingLambda: NodejsFunction;
  indexingQueueUrl: string;

  constructor(scope: Construct, name: string, role: Role) {
    super(scope, name);
    this.sqs = new Queue(this, "correction-background", {
      queueName: "background-ai-correction",
      visibilityTimeout: Duration.seconds(600),
    });
    this.lambda = new LambdaConstruct(
      this,
      "correction-background-lambda",
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
    this.indexingQueue = new Queue(this, "IndexingQueue", {
      queueName: "material-indexing-queue",
      visibilityTimeout: Duration.seconds(600),
    });
    this.indexingLambda = new LambdaConstruct(
      this,
      "indexing-background-lambda",
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
  }
}
