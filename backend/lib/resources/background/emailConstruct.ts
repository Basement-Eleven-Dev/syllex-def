import { Duration } from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { EMAIL_QUEUE_NAME } from "../../../environment";
import { LambdaConstruct } from "../lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Role } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { CfnFunction } from "aws-cdk-lib/aws-lambda";

export class EmailResources extends Construct {
  queue: Queue;
  lambda: NodejsFunction;

  constructor(scope: Construct, name: string, role: Role) {
    super(scope, name);

    // Dead Letter Queue per i messaggi falliti dopo 3 tentativi
    const dlq = new Queue(this, EMAIL_QUEUE_NAME + "-DLQ", {
      queueName: EMAIL_QUEUE_NAME + "-DLQ",
      retentionPeriod: Duration.days(14),
    });

    // Coda principale per i job di invio email
    this.queue = new Queue(this, EMAIL_QUEUE_NAME, {
      queueName: EMAIL_QUEUE_NAME,
      visibilityTimeout: Duration.seconds(11), // Deve essere > timeout della Lambda (10s)
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 10,
      },
    });

    // Lambda worker che processa i messaggi dalla coda
    this.lambda = new LambdaConstruct(
      this,
      "bulk-email-worker",
      "src/_triggers/sendEmailTrigger.ts",
      role,
      {
        EMAIL_QUEUE_URL: this.queue.queueUrl,
      },
      undefined,
      Duration.seconds(10) // Timeout massimo per l'invio di un'email
    ).lambda;

    this.lambda.addEventSource(
      new SqsEventSource(this.queue, {
        batchSize: 1,
        maxConcurrency: 5,
        reportBatchItemFailures: true,
      })
    );
  }
}
