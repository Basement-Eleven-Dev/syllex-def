export const STAGE_NAME: "prod" | "stg" =
  (process.env.STAGE as "prod" | "stg" | undefined) || "stg";
export const BUCKET_NAME: string = "syllex-bucket-v2" + STAGE_NAME;
export const POOL_NAME: string = "SyllexPoolV2" + STAGE_NAME;
export const API_NAME: string = "SyllexRestV2" + STAGE_NAME;
export const LAMBDA_ROLE_NAME: string = "SyllexRoleV2" + STAGE_NAME;
export const BACKGROUND_CORRECTION_QUEUE_NAME: string = 'background-ai-correction-v2'
export const BACKGROUND_INDEXING_QUEUE_NAME: string = 'material-indexing-queue-v2'