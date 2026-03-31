# Database Refactoring Status

## Overview
Refactoring all database requests from `db.collection()` pattern to Mongoose models, and replacing `getDefaultDatabase()` with `connectDatabase()`.

## Progress Summary

### ✅ Completed Modules (14 files)

#### Questions Functions (5/5)
- ✅ `backend/src/functions/questions/createQuestion.ts`
- ✅ `backend/src/functions/questions/editQuestion.ts`
- ✅ `backend/src/functions/questions/deleteQuestion.ts`
- ✅ `backend/src/functions/questions/getQuestions.ts`
- ✅ `backend/src/functions/questions/getQuestionById.ts`

#### Communications Functions (5/5)
- ✅ `backend/src/functions/communications/createCommunication.ts`
- ✅ `backend/src/functions/communications/getCommunications.ts`
- ✅ `backend/src/functions/communications/getCommunicationById.ts`
- ✅ `backend/src/functions/communications/editCommunication.ts`
- ✅ `backend/src/functions/communications/deleteCommunication.ts`

#### Events Functions (4/4)
- ✅ `backend/src/functions/events/createEvent.ts`
- ✅ `backend/src/functions/events/getEvents.ts`
- ✅ `backend/src/functions/events/updateEvent.ts`
- ✅ `backend/src/functions/events/deleteEvent.ts`

### 🔄 Remaining Modules (80+ files)

#### Reports Functions
- `backend/src/functions/reports/createReport.ts`

#### Students Functions
- `backend/src/functions/students/getClassStudents.ts`
- `backend/src/functions/students/getStudents.ts`
- `backend/src/functions/students/tests/executeTest.ts`
- `backend/src/functions/students/tests/getStudentAttempt.ts`
- `backend/src/functions/students/tests/createStudentAttempt.ts`
- `backend/src/functions/students/tests/updateStudentAttempt.ts`
- `backend/src/functions/students/tests/submitStudentAttempt.ts`
- `backend/src/functions/students/selfEvaluation/createSelfEvaluationTest.ts`

#### Tests Functions
- `backend/src/functions/tests/getTests.ts`
- `backend/src/functions/tests/countAssignmentsToGrade.ts`
- `backend/src/functions/tests/getClassAttempts.ts`
- `backend/src/functions/tests/getTestAttemptsDetails.ts`
- `backend/src/functions/tests/getClassTopicsPerformance.ts`
- `backend/src/functions/tests/countPublishedTests.ts`
- `backend/src/functions/tests/editTest.ts`
- `backend/src/functions/tests/duplicateTest.ts`
- `backend/src/functions/tests/updateTestClasses.ts`
- `backend/src/functions/tests/getClassAssignedTests.ts`
- `backend/src/functions/tests/getTestById.ts`
- `backend/src/functions/tests/deleteTest.ts`
- `backend/src/functions/tests/createTest.ts`

#### Attempts Functions
- `backend/src/functions/attempts/correctAttemptWithAI.ts`
- `backend/src/functions/attempts/correctAttempt.ts`
- `backend/src/functions/attempts/getAttemptDetails.ts`

#### Admin Functions
- `backend/src/functions/admin/getOrganizations.ts`
- `backend/src/functions/admin/onboarding/createOnboarding.ts`
- `backend/src/functions/admin/stats/getSuperAdminStats.ts`
- `backend/src/functions/admin/workspace/removeUser.ts`
- `backend/src/functions/admin/workspace/getClassDetail.ts`
- `backend/src/functions/admin/workspace/createClass.ts`
- `backend/src/functions/admin/workspace/getWorkspaceDidactics.ts`
- `backend/src/functions/admin/workspace/createAssignment.ts`
- `backend/src/functions/admin/workspace/bulkImportStudents.ts`
- `backend/src/functions/admin/workspace/getWorkspaceStaff.ts`
- `backend/src/functions/admin/workspace/updateUser.ts`
- `backend/src/functions/admin/workspace/getWorkspaceStudents.ts`
- `backend/src/functions/admin/workspace/createSubject.ts`
- `backend/src/functions/admin/workspace/createUser.ts`
- `backend/src/functions/admin/workspace/getWorkspaceDetails.ts`

#### Teachers Functions
- `backend/src/functions/teachers/generateTestInsight.ts`
- `backend/src/functions/teachers/addTopic.ts`
- `backend/src/functions/teachers/getSubjects.ts`
- `backend/src/functions/teachers/renameTopic.ts`
- `backend/src/functions/teachers/getStudentDetails.ts`
- `backend/src/functions/teachers/generateAttemptInsight.ts`
- `backend/src/functions/teachers/getStudentInsight.ts`

#### Assistants Functions
- `backend/src/functions/assistants/createAssistant.ts`
- `backend/src/functions/assistants/updateAssistant.ts`
- `backend/src/functions/assistants/removeMaterial.ts`
- `backend/src/functions/assistants/getAssistant.ts`

#### Materials Functions
- `backend/src/functions/materials/deleteMaterial.ts`
- `backend/src/functions/materials/deleteMaterialsBatch.ts`
- `backend/src/functions/materials/getMaterials.ts`
- `backend/src/functions/materials/createMaterial.ts`

#### Classes Functions
- `backend/src/functions/classes/getSubjectClasses.ts`
- `backend/src/functions/classes/getAllClasses.ts`

#### Organizations Functions
- `backend/src/functions/organizations/getOrganizationById.ts`
- `backend/src/functions/organizations/getOrganizationStats.ts`

#### Profile Functions
- `backend/src/functions/profile/updateSettings.ts`
- `backend/src/functions/profile/updateEmail.ts`

#### Messages Functions
- `backend/src/functions/messages/listenTomessage.ts`

#### AI Functions
- `backend/src/functions/ai/createAiGenMaterial.ts`
- `backend/src/functions/ai/createAiGenQuestion.ts`

#### Helper Functions
- `backend/src/_helpers/documents/associateFileToAssistant.ts`
- `backend/src/_helpers/AI/generateResponse.ts`
- `backend/src/_helpers/AI/embeddings/vectorizeDocument.ts`
- `backend/src/_helpers/AI/embeddings/retrieveRelevantDocuments.ts`
- `backend/src/_helpers/DB/messages/saveMessage.ts`
- `backend/src/_helpers/DB/messages/buildConversationHistory.ts`
- `backend/src/_helpers/getAuthCognitoUser.ts`
- `backend/src/_helpers/AI/getAssistantVoice.ts`
- `backend/src/_helpers/AI/buildAgent.ts`
- `backend/src/_helpers/email/notifyStudents.ts`

## Refactoring Pattern

### 1. Import Changes
```typescript
// OLD
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

// NEW
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { ModelName } from "../../models";
```

### 2. Connection Changes
```typescript
// OLD
const db = await getDefaultDatabase();
const collection = db.collection("collectionName");

// NEW
await connectDatabase();
// Use Mongoose models directly
```

### 3. Type Casting for Context ObjectIds
When using `context.user?._id` or `context.subjectId` (which are MongoDB ObjectIds), cast queries with `as any`:
```typescript
// Example
const result = await Model.findOne({
  _id: id,
  teacherId: context.user?._id,
} as any);
```

### 4. Operation Mapping
- `collection.insertOne(doc)` → `Model.create(doc)`
- `collection.find().toArray()` → `Model.find().lean()`
- `collection.findOne()` → `Model.findOne()` or `Model.findById()`
- `collection.updateOne()` → `Model.updateOne()`
- `collection.deleteOne()` → `Model.deleteOne()`
- `collection.countDocuments()` → `Model.countDocuments()`
- `collection.aggregate()` → `Model.aggregate()`

## Next Steps

Continue refactoring the remaining files following the established pattern. Priority order:
1. ✅ Questions, Communications, Events (DONE)
2. Reports, Students, Tests
3. Attempts, Admin
4. Teachers, Assistants, Materials
5. Helper functions
6. Final verification and testing
