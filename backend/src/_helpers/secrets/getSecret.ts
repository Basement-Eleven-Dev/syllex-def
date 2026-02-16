import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager"; // ES Modules import
const getFreshSecret = async (secretId: string): Promise<string> => {
  const client = new SecretsManagerClient();
  const input = {
    SecretId: secretId,
  };
  const command = new GetSecretValueCommand(input);
  const response = await client.send(command);
  return response.SecretString || "{}";
};

export const getSecret = async (secretId: string): Promise<string> => {
  if (process.env.STAGE == "stg" || !!process.env.LOCAL_TESTING)
    return await getFreshSecret(secretId);
  else {
    let request = await fetch(
      `http://localhost:${process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT}/secretsmanager/get?secretId=${secretId}`,
      {
        headers: {
          "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN || "",
        },
      },
    );
    let res = await request.json();
    if (!res.SecretString) throw new Error("No secret string found");
    return res.SecretString as string;
  }
};
