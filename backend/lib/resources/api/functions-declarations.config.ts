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
    apiRoute: "teacher/classes",
    functionPath: "teachers/getAllClasses.ts",
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
    apiRoute: "teacher/classes/all",
    functionPath: "teachers/getAllTeacherClasses.ts",
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
    apiRoute: "profile/email",
    functionPath: "profile/updateEmail.ts",
    method: "patch",
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
    apiRoute: "questions",
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
    apiRoute: "materials/subject/{subjectId}",
    functionPath: "materials/getMaterials.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "materials",
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
    functionPath: "materials/moveMaterialsBatch.ts",
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
    apiRoute: "materials/{materialId}/classes",
    functionPath: "materials/updateMaterialClasses.ts",
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
  {
    apiRoute: "organizations/{organizationId}",
    functionPath: "organizations/getOrganizationById.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "tests",
    functionPath: "tests/getTests.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "tests",
    functionPath: "tests/createTest.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "tests/{testId}",
    functionPath: "tests/getTestById.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "tests/{testId}",
    functionPath: "tests/editTest.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "tests/{testId}",
    functionPath: "tests/deleteTest.ts",
    method: "delete",
    role: "teacher",
  },
  {
    apiRoute: "tests/assignments-to-grade/{subjectId}/count",
    functionPath: "tests/countAssignmentsToGrade.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "tests/{testId}/classes",
    functionPath: "tests/updateTestClasses.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "ai/materials",
    functionPath: "ai/createAiGenMaterial.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "proxy/gamma/{generationId}",
    functionPath: "ai/gammaGenerationProxy.ts",
    method: "get",
    role: "open",
  },
  {
    apiRoute: "reports",
    functionPath: "reports/createReport.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "class/{classId}/students",
    functionPath: "students/getClassStudents.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "class/{classId}/{subjectId}/tests",
    functionPath: "tests/getClassAssignedTests.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "attempts/class/{classId}",
    functionPath: "tests/getClassAttempts.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "events",
    functionPath: "events/getEvents.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "events",
    functionPath: "events/createEvent.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "assistants/create",
    functionPath: "assistants/createAssistant.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "events/{eventId}",
    functionPath: "events/deleteEvent.ts",
    method: "delete",
    role: "teacher",
  },
  {
    apiRoute: "assistants/get",
    functionPath: "assistants/getAssistant.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "assistants/response",
    functionPath: "assistants/generateResponse.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "assistants/update",
    functionPath: "assistants/updateAssistant.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "materials/vectorize",
    functionPath: "embeddings/vectorizeMaterials.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "messages/history",
    functionPath: "messages/getConversationHistory.ts",
    method: "post",
    role: "logged",
  },
  {
    apiRoute: "messages/listen",
    functionPath: "messages/listenToMessage.ts",
    method: "post",
    role: "logged",
  },
  {
    apiRoute: "assistants/remove-material",
    functionPath: "assistants/removeMaterial.ts",
    method: "post",
    role: "teacher",
  },
];
