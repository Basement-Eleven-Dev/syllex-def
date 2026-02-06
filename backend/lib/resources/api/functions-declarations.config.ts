export type AppRole = "student" | "teacher" | "logged" | "open";

/**
 * functionPath is the relative path from FUNCTIONS_PATH (in environments.ts)
 */
export type FunctionIntegration = {
  apiRoute: string;
  functionPath: string;
  method: "get" | "post" | "put" | "delete" | "patch" | "options";
  role: AppRole;
};

export const FUNCTION_INTEGRATIONS: FunctionIntegration[] = [
  {
    apiRoute: "teachers/{teacherId}/subjects",
    functionPath: "teachers/getSubjects.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "profile",
    functionPath: "profile/getMyProfile.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "status",
    functionPath: "status.ts",
    method: "get",
    role: "open",
  },
  {
    apiRoute: "files/upload",
    functionPath: "files/createUpload.ts",
    method: "post",
    role: "open", //!!!DA RIMETTERE A ROLE:TEACHER
  },
];
