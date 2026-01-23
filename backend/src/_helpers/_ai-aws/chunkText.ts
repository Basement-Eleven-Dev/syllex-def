import { encodingForModel } from "js-tiktoken";

export function chunkText(
  text: string,
  maxTokens: number = 4096,
  overlapTokens: number = 200
): string[] {
  const tokenizer = encodingForModel("gpt-3.5-turbo"); // Uses cl100k_base encoding
  const tokens = tokenizer.encode(text);

  if (tokens.length <= maxTokens) {
    return [text];
  }

  const chunks: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const end = Math.min(i + maxTokens, tokens.length);
    const chunkTokens = tokens.slice(i, end);
    const chunkText = tokenizer.decode(chunkTokens);
    chunks.push(chunkText);

    if (end === tokens.length) {
      break;
    }
    i += maxTokens - overlapTokens;
  }

  return chunks;
}

// Install with: npm install js-tiktoken
