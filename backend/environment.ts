export const STAGE_NAME: "prod" | "stg" =
  (process.env.STAGE as "prod" | "stg" | undefined) || "stg";
export const BUCKET_NAME: string = "syllex-bucket-" + STAGE_NAME;
export const POOL_NAME: string = "SyllexPool" + STAGE_NAME;
export const API_NAME: string = "SyllexRest" + STAGE_NAME;
export const LAMBDA_ROLE_NAME: string = "SyllexRole" + STAGE_NAME;
