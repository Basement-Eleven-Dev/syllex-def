import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGateway } from "./resources/rest_api";
import { CognitoUserPool } from "./resources/cognito";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import {
  API_NAME,
  BUCKET_NAME,
  LAMBDA_ROLE_NAME,
  POOL_NAME,
} from "../environment";
import { DefaultLambdaRole } from "./resources/roles";
import { BackgroundFunctions } from "./resources/sqs";

//se non funziona in produzione la funzione di background prova questa: const queueUrl = `https://sqs.${this.region}.amazonaws.com/${this.account}/${backgroundFunctions.sqs.queueName}`;

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    let cognito = new CognitoUserPool(this, POOL_NAME);
    let role = new DefaultLambdaRole(this, "role_default").role;
    let backgroundFunctions = new BackgroundFunctions(
      this,
      "BackgroundHandling",
      role
    );
    backgroundFunctions.sqs.grantSendMessages(role);
    backgroundFunctions.indexingQueue.grantSendMessages(role);

    let queueUrl: string = backgroundFunctions.queueUrl;
    let indexingQueueUrl: string = backgroundFunctions.indexingQueueUrl;
    let apiGateway = new RestApiGateway(
      this,
      API_NAME,
      cognito.cognitoPool,
      role,
      queueUrl,
      indexingQueueUrl
    ).apiGateway;
    let bucket = new Bucket(this, BUCKET_NAME, {
      bucketName: BUCKET_NAME,
      versioned: false, // Per un bucket semplice, non abbiamo bisogno del versioning
      publicReadAccess: false, // Manteniamo il bucket privato per impostazione predefinita per sicurezza
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Questo eliminerà il bucket quando lo stack viene distrutto. Usa attenzione in produzione!
      autoDeleteObjects: false,
      cors: [
        {
          // Specifica i domini che possono accedere al bucket
          allowedOrigins: ["*"],

          // Specifica i metodi HTTP permessi (PUT è essenziale per gli upload)
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST,
            HttpMethods.DELETE,
          ],

          // Specifica gli header permessi nelle richieste
          // L'asterisco (*) permette tutti gli header.
          allowedHeaders: ["*"],

          // Specifica gli header che il browser può leggere dalla risposta
          // 'ETag' è utile per verificare l'esito dell'upload
          exposedHeaders: ["ETag"],

          // Opzionale: ID univoco per la regola
          id: "my-cors-rule-id",

          // Opzionale: per quanto tempo il browser può mettere in cache la risposta pre-flight
          maxAge: 3000,
        },
      ],
    });
  }
}
