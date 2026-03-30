export const STAGE_NAME: "prod" | "stg" =
  (process.env.STAGE as "prod" | "stg" | undefined) || "stg";

//STACK ENVIRONMENT VARIABLES
export const AWS_REGION = "eu-south-1";
export const STACK_NAME = "SyllexApiV2" + (STAGE_NAME == 'prod' ? 'Prod' : 'Stg');
export const POOL_NAME: string = "SyllexPoolV2" + STAGE_NAME;
export const API_NAME: string = "SyllexRestV2" + STAGE_NAME;
export const LAMBDA_ROLE_NAME: string = "SyllexRoleV2" + STAGE_NAME;
export const INDEXING_QUEUE_NAME = "syllex_indexing_queue_v2-" + STAGE_NAME
export const EMAIL_QUEUE_NAME = "syllex_bulk_email_queue-" + STAGE_NAME
export const BUCKET_NAME: string = "syllex-bucket-refactoring-" + STAGE_NAME; //used only in lambda, external to cdk

//STACK OPERATIONS ENVIRONMENT VARIABLES
export const FUNCTIONS_PATH = "src/functions/";