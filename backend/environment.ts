export const STAGE_NAME: "prod" | "stg" =
  (process.env.STAGE as "prod" | "stg" | undefined) || "stg";
export const BUCKET_NAME: string = "syllex-bucket-refactoring" + STAGE_NAME;
export const POOL_NAME: string = "SyllexPoolV2" + STAGE_NAME;
export const API_NAME: string = "SyllexRestV2" + STAGE_NAME;
export const LAMBDA_ROLE_NAME: string = "SyllexRoleV2" + STAGE_NAME;
export const FUNCTIONS_PATH = "src/functions/";
export const AWS_REGION = "eu-south-1";
export const INDEXING_QUEUE_NAME = "syllex_indexing_queue_v2"