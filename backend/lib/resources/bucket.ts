import { Bucket, EventType, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { BUCKET_NAME } from "../../environment";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { LambdaConstruct } from "./lambda";
import {
  Role,
  PolicyStatement,
  Effect,
  AnyPrincipal,
} from "aws-cdk-lib/aws-iam";

export class MainBucket extends Construct {
  bucket: Bucket;
  constructor(
    scope: Construct,
    name: string,
    private lambdaRole: Role,
  ) {
    super(scope, name);
    this.bucket = new Bucket(this, "bucket-main", {
      bucketName: BUCKET_NAME,
      versioned: false, // Per un bucket semplice, non abbiamo bisogno del versioning
      publicReadAccess: true, // Permette lettura pubblica degli oggetti con ACL public-read
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: RemovalPolicy.DESTROY,
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

    this.addNotifications();
  }
  addNotifications() {
    let lambda = new LambdaConstruct(
      this,
      "create-object-on-db",
      "src/_triggers/createDatabaseFile.ts",
      this.lambdaRole,
    ).lambda;
    this.bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(lambda),
    );
  }
}
