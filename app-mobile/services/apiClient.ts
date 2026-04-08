import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import * as SecureStore from "expo-secure-store";
import { Config } from "../constants";

const SUBJECT_ID_KEY = "selectedSubjectId";

if (__DEV__) {
  console.log("[API] Base URL:", Config.apiUrl);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: Config.apiUrl,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Cognito idToken + optional Subject-Id header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // unauthenticated request — proceed without token
    }

    try {
      const subjectId = await SecureStore.getItemAsync(SUBJECT_ID_KEY);
      if (subjectId) {
        config.headers["Subject-Id"] = subjectId;
      }
    } catch {
      // SecureStore unavailable — skip header
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response error interceptor — surfaces HTTP error details
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Network error";
    return Promise.reject(new Error(String(message)));
  },
);

export { apiClient, SUBJECT_ID_KEY };
