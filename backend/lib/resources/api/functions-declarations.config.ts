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
    apiRoute: "admin/organizations/{organizationId}/import-students",
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
    apiRoute: "admin/global-stats",
    functionPath: "admin/stats/getSuperAdminStats.ts",
    method: "get",
    role: "admin",
  },
]

const SUBJECTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "subjects",
    functionPath: "teachers/getSubjects.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "topics",
    functionPath: "teachers/addTopic.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "topics/{topicId}",
    functionPath: "teachers/renameTopic.ts",
    method: "put",
    role: "teacher",
  },

]

const CLASSES_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "classes",
    functionPath: "classes/getSubjectClasses.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "classes/{classId}/students",
    functionPath: "students/getClassStudents.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "classes/{classId}/tests",
    functionPath: "tests/getClassAssignedTests.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "assignments",
    functionPath: "classes/getAllClasses.ts",
    method: "get",
    role: "logged",
  },


]

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
]

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
]

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
]

const QUESTIONS_ROUTES: FunctionIntegration[] = [
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
    role: "teacher",
  },
  {
    apiRoute: "questions",
    functionPath: "questions/createQuestion.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "questions/{questionId}",
    functionPath: "questions/editQuestion.ts",
    method: "put",
    role: "teacher",
  },
]

const AI_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "ai/questions",
    functionPath: "ai/createAiGenQuestion.ts",
    method: "post",
    role: "open",
  }, {
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
  }
]

const STUDENTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "students/{studentId}",
    functionPath: "teachers/getStudentDetails.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "students/{studentId}/insight",
    functionPath: "teachers/getStudentInsight.ts",
    method: "get",
    role: "teacher",
  },


]

const ASSISTANTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "assistant",
    functionPath: "assistants/createAssistant.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "assistant",
    functionPath: "assistants/getAssistant.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "assistant",
    functionPath: "assistants/updateAssistant.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "assistant/response",
    functionPath: "assistants/generateResponse.ts",
    method: "post",
    role: "logged",
  },
  {
    apiRoute: "assistant/materials/{materialId}",
    functionPath: "assistants/removeMaterial.ts",
    method: "delete",
    role: "teacher",
  },
  {
    apiRoute: "messages",
    functionPath: "messages/getConversationHistory.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "messages/{messageId}/generate-audio",
    functionPath: "messages/listenToMessage.ts",
    method: "post",
    role: "logged",
  },
]

const MATERIALS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "files/upload",
    functionPath: "files/createUpload.ts",
    method: "post",
    role: "teacher",
  }, {
    apiRoute: "proxy/gamma/{generationId}",
    functionPath: "ai/gammaGenerationProxy.ts",
    method: "get",
    role: "open",
  },
  {
    apiRoute: "materials",
    functionPath: "materials/getMaterials.ts",
    method: "get",
    role: "logged",
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
    apiRoute: "materials/{materialId}/rename",
    functionPath: "materials/renameMaterial.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "batch/materials/move",
    functionPath: "materials/moveMaterialsBatch.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "batch/materials/delete",
    functionPath: "materials/deleteMaterialsBatch.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "batch/materials/vectorize",
    functionPath: "embeddings/vectorizeMaterials.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "materials/{materialId}/classes",
    functionPath: "materials/updateMaterialClasses.ts",
    method: "put",
    role: "teacher",
  },
]

const TESTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "tests",
    functionPath: "tests/getTests.ts",
    method: "get",
    role: "logged",
  },
  {
    apiRoute: "tests",
    functionPath: "tests/createTest.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "tests/{testId}/insight",
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
    apiRoute: "tests/{testId}/classes",
    functionPath: "tests/updateTestClasses.ts",
    method: "put",
    role: "teacher",
  },
  {
    apiRoute: "test/{testId}/attempts-details",
    functionPath: "tests/getTestAttemptsDetails.ts",
    method: "get",
    role: "teacher",
  },

]

const ATTEMPTS_ROUTES: FunctionIntegration[] = [
  {
    apiRoute: "attempts/{attemptId}/details",
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
    apiRoute: "attempts/{attemptId}/questions/{questionId}/ai-correction",
    functionPath: "attempts/correctAttemptWithAI.ts",
    method: "post",
    role: "teacher",
  },
  {
    apiRoute: "attempts/{attemptId}/insight",
    functionPath: "teachers/generateAttemptInsight.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "test/{testId}/attempt", //missing /{attemptId}?
    functionPath: "students/tests/getStudentAttempt.ts",
    method: "get",
    role: "student",
  },
  {
    apiRoute: "test/{testId}/attempt",
    functionPath: "students/tests/createStudentAttempt.ts",
    method: "post",
    role: "student",
  },
  {
    apiRoute: "test/{testId}/attempt/{attemptId}",
    functionPath: "students/tests/updateStudentAttempt.ts",
    method: "put",
    role: "student",
  },
  {
    apiRoute: "test/{testId}/attempt/{attemptId}/submit",
    functionPath: "students/tests/submitStudentAttempt.ts",
    method: "post",
    role: "student",
  },
]





export const FUNCTION_INTEGRATIONS: FunctionIntegration[] = [
  ...MISC_ROUTES,
  ...ADMIN_ROUTES,
  ...EVENTS_ROUTES,
  ...TESTS_ROUTES,
  ...SUBJECTS_ROUTES,
  ...CLASSES_ROUTES,
  ...COMMUNICATIONS_ROUTES,
  ...QUESTIONS_ROUTES,
  ...AI_ROUTES,
  ...STUDENTS_ROUTES,
  ...ASSISTANTS_ROUTES,
  ...MATERIALS_ROUTES,
  ...ATTEMPTS_ROUTES,
  {
    apiRoute: "tests/assignments-to-grade/count",
    functionPath: "tests/countAssignmentsToGrade.ts",
    method: "get",
    role: "teacher",
  },
  {
    apiRoute: "students/test/execution",
    functionPath: "students/tests/executeTest.ts",
    method: "post",
    role: "student",
  },
  {
    apiRoute: "students/self-evaluation",
    functionPath: "students/selfEvaluation/createSelfEvaluationTest.ts",
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
  }
];
