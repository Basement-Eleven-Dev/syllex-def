export interface User {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "teacher" | "student" | "admin";
  organizationId?: string;
  organizationIds?: string[];
  privacyPolicyAccepted?: boolean;
  aiPolicyAccepted?: boolean;
  termsAcceptation?: {
    accepted?: boolean;
    timestamp?: string;
    version?: string;
  };
  privacyAcceptation?: {
    accepted?: boolean;
    timestamp?: string;
    version?: string;
  };
  notificationSettings?: {
    newCommunication: boolean;
    newEvent: boolean;
    newTest: boolean;
    testCorrected: boolean;
  };
}
