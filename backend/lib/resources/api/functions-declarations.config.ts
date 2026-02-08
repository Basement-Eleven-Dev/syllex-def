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
    apiRoute: "teacher/{subjectId}/classes",
    functionPath: "teachers/getSubjectClasses.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "students",
    functionPath: "students/getStudents.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "teacher/classes",
    functionPath: "teachers/getAllClasses.ts",
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
  {
    apiRoute: "questions",
    functionPath: "questions/getQuestions.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "questions/{questionId}",
    functionPath: "questions/getQuestionById.ts",
    method: "get",
    role: "logged", //!!!DA RIMETTERE A ROLE:TEACHER
  },
  {
    apiRoute: "questions/create",
    functionPath: "questions/createQuestion.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "questions/{questionId}/edit",
    functionPath: "questions/editQuestion.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "materials/{subjectId}",
    functionPath: "materials/getMaterials.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "materials/create",
    functionPath: "materials/createMaterial.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "materials/{materialId}",
    functionPath: "materials/deleteMaterial.ts",
    method: "delete",
    role: "teacher",
  },
  {
    apiRoute: "materials/{materialId}/move",
    functionPath: "materials/moveMaterial.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "materials/move-batch",
    functionPath: "materials/moveMaterial.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "materials/{materialId}/rename",
    functionPath: "materials/renameMaterial.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "communications",
    functionPath: "communications/getCommunications.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "communications",
    functionPath: "communications/createCommunication.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "communications/{communicationId}",
    functionPath: "communications/getCommunicationById.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "communications/{communicationId}",
    functionPath: "communications/editCommunication.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "communications/{communicationId}",
    functionPath: "communications/deleteCommunication.ts",
    method: "delete",
    role: "teacher",
  },
];
