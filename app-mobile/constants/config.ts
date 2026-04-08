// Cognito & API configuration — mirrors frontend/src/environments/environment*.ts
import Constants from "expo-constants";

const PROD_API_URL =
  "https://webqzh6z3m.execute-api.eu-south-1.amazonaws.com/prod/";

/**
 * In Expo Go on a physical device, `localhost` resolves to the device itself.
 * We derive the dev server host from Metro's hostUri (e.g. "192.168.1.9:8081")
 * so the API call always reaches the Mac running the local backend.
 */
const getDevApiUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }
  return "http://localhost:3000";
};

export const Config = {
  apiUrl: __DEV__ ? getDevApiUrl() : PROD_API_URL,

  cognito: {
    userPoolId: "eu-south-1_w77iyt3xa",
    userPoolClientId: "4tc0qd18cvu46tbkccoi1nc12e",
    region: "eu-south-1",
  },
  appScheme: "syllex",
} as const;
