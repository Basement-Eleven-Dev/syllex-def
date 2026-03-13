export type AppRole = "student" | "teacher" | "logged" | "open" | "admin";

/**
 * functionPath is the relative path from FUNCTIONS_PATH (in environments.ts)
 */
export type FunctionIntegration = {
  apiRoute: string;
  functionPath: string;
  method: "get" | "post" | "put" | "delete" | "patch" | "options";
  role: AppRole;
  extensionLayers?: { name: string; arn: string }[];
};

const ADMIN_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "admin/onboarding",
    functionPath: "admin/onboarding/createOnboarding.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations",
    functionPath: "admin/getOrganizations.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/workspace",
    functionPath: "admin/workspace/getWorkspaceDetails.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/staff",
    functionPath: "admin/workspace/getWorkspaceStaff.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/students",
    functionPath: "admin/workspace/getWorkspaceStudents.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/didactics",
    functionPath: "admin/workspace/getWorkspaceDidactics.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/users", // Creazione utenti lato admin
    functionPath: "admin/workspace/createUser.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/students/bulk",
    functionPath: "admin/workspace/bulkImportStudents.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/classes/{classId}",
    functionPath: "admin/workspace/getClassDetail.ts",
    method: "get",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/users/{userId}",
    functionPath: "admin/workspace/removeUser.ts",
    method: "delete",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/users/{userId}",
    functionPath: "admin/workspace/updateUser.ts",
    method: "put",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/classes",
    functionPath: "admin/workspace/createClass.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/subjects",
    functionPath: "admin/workspace/createSubject.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/assignments",
    functionPath: "admin/workspace/createAssignment.ts",
    method: "post",
    role: "admin",
  },
  {
    apiRoute: "admin/organizations/{organizationId}/stats",
    functionPath: "organizations/getOrganizationStats.ts",
    method: "get",
    role: "admin",
  },
  /*   {
    apiRoute: "admin/organizations/stats",
    functionPath: "admin/consumptions/getOrganizationStats.ts",
    method: "get",
    role: "admin",
  }, */
  {
    apiRoute: "admin/stats/global",
    functionPath: "admin/stats/getSuperAdminStats.ts",
    method: "get",
    role: "admin",
  },
];

const SUBJECTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "teachers/{teacherId}/subjects",
    functionPath: "teachers/getSubjects.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "subjects/{subjectId}/topics",
    functionPath: "teachers/addTopic.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "subjects/{subjectId}/topics/{topicId}",
    functionPath: "teachers/renameTopic.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "teacher/subject/classes",
    functionPath: "teachers/getSubjectClasses.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "student/subject/classes",
    functionPath: "students/getStudentSubjectClasses.ts",
    method: "get",
    role: "student",
  },
];

const CLASSES_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "teacher/classes",
    functionPath: "teachers/getAllClasses.ts",
    method: "get",
    role: "teacher",
  },

  {
    apiRoute: "teacher/classes/all",
    functionPath: "teachers/getAllTeacherClasses.ts",
    method: "get",
    role: "teacher",
  },
];

const MATERIALS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "files/upload",
    functionPath: "files/createUpload.ts",
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
    apiRoute: "materials/subject",
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
    apiRoute: "materials/{materialId}",
    functionPath: "materials/getMaterialById.ts",
    method: "get",
    role: "student",
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
    apiRoute: "materials/delete-batch",
    functionPath: "materials/deleteMaterialsBatch.ts",
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
    apiRoute: "materials/vectorize",
    functionPath: "embeddings/vectorizeMaterials.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "students/me/materials",
    functionPath: "students/getStudentMaterials.ts",
    method: "get",
    role: "student",
  },
  {
    apiRoute: "ai/materials",
    functionPath: "ai/createAiGenMaterial.ts",
    method: "post",
    role: "teacher",
    extensionLayers: [
      {
        name: "pandoc",
        arn: "arn:aws:lambda:eu-south-1:851725509686:layer:pandoc:1",
      } /*, {
      name: "wkhtml",
      arn: "arn:aws:lambda:eu-south-1:851725509686:layer:wkhtmltox:1"
    }*/,
    ],
  },
];

const ATTEMPTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "test/attempts/details/{testId}",
    functionPath: "tests/getTestAttemptsDetails.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "attempts/details/{attemptId}",
    functionPath: "attempts/getAttemptDetails.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "attempts/{attemptId}/correction",
    functionPath: "attempts/correctAttempt.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "attempts/{attemptId}/{questionId}/correction/ai",
    functionPath: "attempts/correctAttemptWithAI.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "attempts/insight/{attemptId}",
    functionPath: "teachers/generateAttemptInsight.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "students/test/{testId}/attempt",
    functionPath: "students/tests/getStudentAttempt.ts",
    method: "get",
    role: "student",
  },
  {
    apiRoute: "students/test/attempt",
    functionPath: "students/tests/createStudentAttempt.ts",
    method: "post",
    role: "student",
  },
  {
    apiRoute: "students/test/attempt/{attemptId}",
    functionPath: "students/tests/updateStudentAttempt.ts",
    method: "put",
    role: "student",
  },
  {
    apiRoute: "students/test/attempt/{attemptId}/submit",
    functionPath: "students/tests/submitStudentAttempt.ts",
    method: "post",
    role: "student",
  },
  {
    apiRoute: "attempts/class/{classId}",
    functionPath: "tests/getClassAttempts.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "attempts/class/{classId}/topics-performance",
    functionPath: "tests/getClassTopicsPerformance.ts",
    method: "get",
    role: "teacher",
  },
];

const QUESTIONS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "ai/questions",
    functionPath: "ai/createAiGenQuestion.ts",
    method: "post",
    role: "open",
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
    apiRoute: "questions/{questionId}",
    functionPath: "questions/deleteQuestion.ts",
    method: "delete",
    role: "teacher",
  },
];

const COMMUNICATIONS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "communications",
    functionPath: "communications/getCommunications.ts",
    method: "get",
    role: "logged",
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

const TESTS_ROUTES: FunctionIntegration[] = [
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
    apiRoute: "students/self-evaluation",
    functionPath: "students/selfEvaluation/createSelfEvaluationTest.ts",
    method: "post",
    role: "student",
  },

  {
    apiRoute: "test/insight/{testId}",
    functionPath: "teachers/generateTestInsight.ts",
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
    apiRoute: "tests/{testId}/duplicate",
    functionPath: "tests/duplicateTest.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "tests/assignments-to-grade/count",
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
    apiRoute: "class/{classId}/tests",
    functionPath: "tests/getClassAssignedTests.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "students/tests",
    functionPath: "students/tests/getStudentTests.ts",
    method: "get",
    role: "student",
  },
  {
    apiRoute: "students/test/execution",
    functionPath: "students/tests/executeTest.ts",
    method: "post",
    role: "student",
  },
];

const ASSISTANTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "assistants/create",
    functionPath: "assistants/createAssistant.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "assistants/get",
    functionPath: "assistants/getAssistant.ts",
    method: "post",
    role: "logged",
  },
  {
    apiRoute: "assistants/response",
    functionPath: "assistants/generateResponse.ts",
    method: "post",
    role: "logged",
  },
  {
    apiRoute: "assistants/update",
    functionPath: "assistants/updateAssistant.ts",
    method: "post",
    role: "teacher",
  },

  {
    apiRoute: "assistants/remove-material",
    functionPath: "assistants/removeMaterial.ts",
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
];

const STUDENTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "students",
    functionPath: "students/getStudents.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "teacher/students/{studentId}/details",
    functionPath: "teachers/getStudentDetails.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "teacher/students/{studentId}/insight",
    functionPath: "teachers/generateStudentInsight.ts",
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
    apiRoute: "students/me/subjects",
    functionPath: "students/getStudentSubjects.ts",
    method: "get",
    role: "student",
  },
  {
    apiRoute: "student/classes/all",
    functionPath: "students/getAllStudentClasses.ts",
    method: "get",
    role: "student",
  },
];

const EVENTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "events",
    functionPath: "events/getEvents.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "events",
    functionPath: "events/createEvent.ts",
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
    apiRoute: "events/{eventId}",
    functionPath: "events/updateEvent.ts",
    method: "put",
    role: "teacher",
  },
];

const MISC_ROUTES: FunctionIntegration[] = [
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
    apiRoute: "profile/settings",
    functionPath: "profile/updateSettings.ts",
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
    apiRoute: "organizations/{organizationId}",
    functionPath: "organizations/getOrganizationById.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "reports",
    functionPath: "reports/createReport.ts",
    method: "post",
    role: "teacher",
  },
];
export const FUNCTION_INTEGRATIONS: FunctionIntegration[] = [
  ...ADMIN_ROUTES,
  ...SUBJECTS_ROUTES,
  ...MATERIALS_ROUTES,
  ...ATTEMPTS_ROUTES,
  ...QUESTIONS_ROUTES,
  ...COMMUNICATIONS_ROUTES,
  ...TESTS_ROUTES,
  ...ASSISTANTS_ROUTES,
  ...STUDENTS_ROUTES,
  ...EVENTS_ROUTES,
  ...CLASSES_ROUTES,
  ...MISC_ROUTES,
];
