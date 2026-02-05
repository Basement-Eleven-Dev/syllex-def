import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGateway } from "./resources/api/rest_api";
import { CognitoUserPool } from "./resources/cognito";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import {
  API_NAME,
  BUCKET_NAME,
  POOL_NAME,
} from "../environment";
import { DefaultLambdaRole } from "./resources/roles";
import { DeployStack } from "./resources/api/api_stage";


//se non funziona in produzione la funzione di background prova questa: const queueUrl = `https://sqs.${this.region}.amazonaws.com/${this.account}/${backgroundFunctions.sqs.queueName}`;

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



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
          id: "my-cors-rule-id-v2",

          // Opzionale: per quanto tempo il browser può mettere in cache la risposta pre-flight
          maxAge: 3000,
        },
      ],
    });

    let cognito = new CognitoUserPool(this, POOL_NAME);
    let role = new DefaultLambdaRole(this, "role_default_v2").role;
    let apiGatewayInstance = new RestApiGateway(
      this,
      API_NAME,
      cognito.cognitoPool,
      cognito.cognitoPoolClient,
      role
    );
    new DeployStack(this, { restApiId: apiGatewayInstance.apiGateway.restApiId, methods: apiGatewayInstance.methods })

  }
}

