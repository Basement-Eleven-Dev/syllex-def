# Database Refactoring Guide

## Pattern to Follow

### Import Changes
```typescript
// OLD
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

// NEW
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { ModelName } from "../../models";
```

### Connection Changes
```typescript
// OLD
const db = await getDefaultDatabase();
const collection = db.collection("collectionName");

// NEW
await connectDatabase();
// Use Mongoose models directly
```

### Collection to Model Mapping
- `db.collection("users")` → `User`
- `db.collection("tests")` → `Test`
- `db.collection("attempts")` → `Attempt`
- `db.collection("questions")` → `Question`
- `db.collection("classes")` → `Class`
- `db.collection("subjects")` or `db.collection("SUBJECTS")` → `Subject`
- `db.collection("communications")` → `Communication`
- `db.collection("assistants")` → `Assistant`
- `db.collection("organizations")` → `Organization`
- `db.collection("events")` → `Event`
- `db.collection("materials")` → `Material`
- `db.collection("messages")` → `Message`
- `db.collection("teacher_assignments")` → `TeacherAssignment`
- `db.collection("topics")` → `Topic`
- `db.collection("file_embeddings")` → `FileEmbedding`
- `db.collection("reports")` → `Report`

### ObjectId Handling
- Use string IDs directly with Mongoose (it handles conversion)
- For explicit ObjectId creation: `new Types.ObjectId(id)`
- Avoid `new ObjectId()` from mongodb package

### Operation Mapping
- `collection.findOne()` → `Model.findOne()`
- `collection.find()` → `Model.find()`
- `collection.insertOne()` → `Model.create()`
- `collection.insertMany()` → `Model.insertMany()`
- `collection.updateOne()` → `Model.updateOne()`
- `collection.updateMany()` → `Model.updateMany()`
- `collection.deleteOne()` → `Model.deleteOne()`
- `collection.deleteMany()` → `Model.deleteMany()`
- `collection.countDocuments()` → `Model.countDocuments()`
- `collection.aggregate()` → `Model.aggregate()`
