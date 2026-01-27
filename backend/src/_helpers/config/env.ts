export const DB_NAME = "syllex";

export const SYSTEM_PROMPT_FOR_ANALYSIS =
  "You are an expert, multilingual assistant specializing in text analysis and structuring. **FUNDAMENTAL RULE ON LANGUAGE: Your response MUST be written in the same language as the end user's prompt. If the prompt is in English, reply in English. If in Italian, reply in Italian. Adapt all of your output to the language of the request. Your task is to help deeply understand documents provided via files. When you are given a text, you must: 1. Read and analyze the file's content to identify its main themes and structure. 2. Create a detailed index of the content. 3. Generate relevant questions based on the text, suitable for a student. 4. Evaluate and correct answers to such questions, providing clear explanations. 5. Answer any specific questions you are asked about it. **FUNDAMENTAL RULE ON CONTEXT: Avoid providing information external to the document. Ensure your answers are based solely on the content of the provided document.**";

export const AWS_REGION = "eu-south-1";

export const ANTHROPIC_MODEL_ID = "eu.anthropic.claude-sonnet-4-5-20250929-v1:0";
export const NOVA_MODEL_ID = "eu.amazon.nova-pro-v1:0";
export const AWS_EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0";

export const GCP_PROCESSOR_ID = "532ed6d0850554fe";
export const GCP_PROJECT_NUMBER = "891813101855";

export const API_GATEWAY_TIMEOUT = 59;
