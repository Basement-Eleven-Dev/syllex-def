import { create } from "zustand";
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference,
  fetchMFAPreference,
} from "aws-amplify/auth";
import { apiClient } from "../services/apiClient";
import { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  getMfaEnabled: () => Promise<boolean>;
  setupMfa: () => Promise<string>;
  verifyMfaSetup: (code: string) => Promise<void>;
  disableMfa: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("[Auth] Initializing — checking current user...");
      const currentUser = await getCurrentUser();
      console.log("[Auth] Current user found:", currentUser.username);
      await get().fetchProfile();
      set({ isAuthenticated: true });
    } catch (err) {
      console.log(
        "[Auth] No active session:",
        err instanceof Error ? err.message : err,
      );
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Amplify v6: throws UserAlreadyAuthenticatedException if a stale session
      // exists. Sign out silently before attempting a new sign-in.
      try {
        await signOut();
      } catch {
        /* no active session — ignore */
      }

      console.log("[Auth] signIn attempt for:", email);
      const { nextStep } = await signIn({
        username: email,
        password,
        options: { authFlowType: "USER_PASSWORD_AUTH" },
      });
      console.log("[Auth] SignIn nextStep:", nextStep.signInStep);

      if (nextStep.signInStep !== "DONE") {
        // MFA / new password required — surface a clear message to the user
        const challenge = nextStep.signInStep;
        set({
          error: `Auth challenge not supported: ${challenge}`,
          isLoading: false,
        });
        return;
      }

      // Force-refresh ensures idToken is populated before the API call
      console.log("[Auth] Fetching session...");
      const session = await fetchAuthSession({ forceRefresh: true });
      console.log(
        "[Auth] Session obtained, hasIdToken:",
        !!session.tokens?.idToken,
      );

      console.log("[Auth] Fetching profile...");
      await get().fetchProfile();
      console.log("[Auth] Profile fetched successfully");
      set({ isAuthenticated: true });
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : "Unknown";
      const errMsg = err instanceof Error ? err.message : String(err);
      // Log full error chain for debugging
      console.log(`[Auth] Login error [${errName}]:`, errMsg);
      if (err instanceof Error && "underlyingError" in err) {
        console.log(
          "[Auth] Underlying error:",
          (err as Record<string, unknown>).underlyingError,
        );
      }
      if (err instanceof Error && err.cause) {
        console.log("[Auth] Error cause:", err.cause);
      }
      console.log(
        "[Auth] Full error:",
        JSON.stringify(err, Object.getOwnPropertyNames(err as object)),
      );
      set({ error: errMsg, isAuthenticated: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchProfile: async () => {
    const { data } = await apiClient.get<User>("/profile");
    set({ user: data });
  },

  forgotPassword: async (email: string) => {
    await resetPassword({ username: email });
  },

  confirmForgotPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    await updatePassword({ oldPassword, newPassword });
  },

  getMfaEnabled: async () => {
    try {
      const preference = await fetchMFAPreference();
      return preference.preferred === "TOTP";
    } catch {
      return false;
    }
  },

  setupMfa: async () => {
    const totpDetails = await setUpTOTP();
    return totpDetails.getSetupUri("Syllex").toString();
  },

  verifyMfaSetup: async (code: string) => {
    await verifyTOTPSetup({ code });
    await updateMFAPreference({ totp: "PREFERRED" });
  },

  disableMfa: async () => {
    await updateMFAPreference({ totp: "NOT_PREFERRED" });
  },

  clearError: () => set({ error: null }),
}));
