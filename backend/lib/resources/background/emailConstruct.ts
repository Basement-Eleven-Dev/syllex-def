import { Duration } from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { EMAIL_QUEUE_NAME } from "../../../environment";
import { LambdaConstruct } from "../lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Role } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class EmailResources extends Construct {
  queue: Queue;
  lambda: NodejsFunction;

  constructor(scope: Construct, name: string, role: Role) {
    super(scope, name);

    // Dead Letter Queue per i messaggi falliti dopo 3 tentativi
    const dlq = new Queue(this, "bulk-email-dlq", {
      queueName: EMAIL_QUEUE_NAME + "-DLQ",
      retentionPeriod: Duration.days(14),
    });

    // Coda principale per i job di invio email
    this.queue = new Queue(this, "bulk-email-queue", {
      queueName: EMAIL_QUEUE_NAME,
      visibilityTimeout: Duration.seconds(600), // Deve essere >= al timeout della Lambda (600s di default)
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
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
      }
    ).lambda;

    // Trigger: 1 messaggio alla volta (ogni messaggio contiene già fino a 50 destinatari)
    // ReservedConcurrency a 5 per rispettare il sending rate di SES
    this.lambda.addEventSource(
      new SqsEventSource(this.queue, {
        batchSize: 1,
        maxConcurrency: 5,
      })
    );
  }
}
