import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getSuperAdminStats = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();

  // 1. Global KPIs
  const totalOrganizations = await db.collection("organizations").countDocuments({});
  const totalUsers = await db.collection("users").countDocuments({ role: { $ne: "superadmin" } });
  
  // AI Knowledge Base Size (Total chunks)
  const totalChunks = await db.collection("file_embeddings").countDocuments({});

  // Estimated Total Tokens (Approx 1 token every 4 characters)
  const tokenEstimation = await db.collection("file_embeddings").aggregate([
    {
      $project: {
        tokenCount: { $divide: [{ $strLenCP: "$text" }, 4] }
      }
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: "$tokenCount" }
      }
    }
  ]).toArray();

  // AI Generated Materials
  const totalAiMaterials = await db.collection("materials").countDocuments({ aiGenerated: true });

  const globalKpis = {
    totalOrganizations,
    totalUsers,
    totalChunks,
    estimatedTotalTokens: Math.round(tokenEstimation[0]?.totalTokens || 0),
    totalAiMaterials
  };

  // 2. Multi-Tenant Overview (Top Organizations by Usage)
  const orgStats = await db.collection("file_embeddings").aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subject",
        foreignField: "_id",
        as: "subjectData"
      }
    },
    { $unwind: "$subjectData" },
    {
      $group: {
        _id: "$subjectData.organizationId",
        documentIds: { $addToSet: "$referenced_file_id" },
        chunkCount: { $sum: 1 },
        estimatedTokens: { $sum: { $divide: [{ $strLenCP: "$text" }, 4] } }
      }
    },
    {
      $lookup: {
        from: "organizations",
        localField: "_id",
        foreignField: "_id",
        as: "org"
      }
    },
    { $unwind: "$org" },
    {
      $lookup: {
        from: "users",
        let: { orgId: "$_id" },
        pipeline: [
          { $match: { $expr: { $or: [{ $eq: ["$organizationId", "$$orgId"] }, { $in: ["$$orgId", { $ifNull: ["$organizationIds", []] }] }] } } },
          { $count: "count" }
        ],
        as: "userCount"
      }
    },
    {
      $project: {
        _id: 0,
        organizationId: "$_id",
        name: "$org.name",
        userCount: { $arrayElemAt: ["$userCount.count", 0] },
        documentCount: { $size: "$documentIds" },
        chunkCount: 1,
        estimatedTokens: { $round: ["$estimatedTokens", 0] },
        onboardingStatus: {
          $cond: [
            { $ifNull: ["$org.onboardingStatus", false] },
            "$org.onboardingStatus",
            {
              $cond: [
                { $gt: [{ $size: "$documentIds" }, 0] },
                "Attivo",
                "Configurata"
              ]
            }
          ]
        }
      }
    },
    { $sort: { estimatedTokens: -1 } }
  ]).toArray() as any[];

  // 2.1 AI Materials count per organization
  const aiMaterialsByOrg = await db.collection("materials").aggregate([
    { $match: { aiGenerated: true } },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $group: {
        _id: "$subject.organizationId",
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  const aiMaterialsMap = new Map(aiMaterialsByOrg.map(item => [item._id.toString(), item.count]));

  // Add aiMaterialCount to orgStats
  orgStats.forEach(org => {
    org.aiMaterialCount = aiMaterialsMap.get(org.organizationId.toString()) || 0;
  });

  // Add organizations that might not have any embeddings yet (they won't appear in the above aggregation)
  const allOrgs = await db.collection("organizations").find({}).toArray();
  const existingOrgIds = orgStats.map(o => o.organizationId.toString());
  
  for (const org of allOrgs) {
    if (!existingOrgIds.includes(org._id.toString())) {
      // Check if this org has subjects
      const subjectCount = await db.collection("subjects").countDocuments({ organizationId: org._id });
      
      // Check user count
      const userCount = await db.collection("users").countDocuments({ 
        $or: [{ organizationId: org._id }, { organizationIds: org._id }] 
      });

      orgStats.push({
        organizationId: org._id,
        name: org.name,
        userCount: userCount,
        documentCount: 0,
        chunkCount: 0,
        estimatedTokens: 0,
        aiMaterialCount: aiMaterialsMap.get(org._id.toString()) || 0,
        onboardingStatus: org.onboardingStatus || (subjectCount > 0 ? "Configurata" : "Pendente")
      });
    }
  }

  // 3. Technical Analysis: Heavy Subjects
  const heavySubjects = await db.collection("file_embeddings").aggregate([
    {
      $group: {
        _id: "$subject",
        chunkCount: { $sum: 1 },
        estimatedTokens: { $sum: { $divide: [{ $strLenCP: "$text" }, 4] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subjectData"
      }
    },
    { $unwind: "$subjectData" },
    {
      $project: {
        _id: 0,
        subjectId: "$_id",
        name: "$subjectData.name",
        chunkCount: 1,
        estimatedTokens: { $round: ["$estimatedTokens", 0] }
      }
    },
    { $sort: { estimatedTokens: -1 } },
    { $limit: 10 }
  ]).toArray();

  // 4. Most Active Teachers (by uploads/chunks)
  const activeTeachers = await db.collection("file_embeddings").aggregate([
    {
      $group: {
        _id: "$teacher_id",
        chunkCount: { $sum: 1 },
        documentIds: { $addToSet: "$referenced_file_id" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "teacherData"
      }
    },
    { $unwind: "$teacherData" },
    {
      $project: {
        _id: 0,
        teacherId: "$_id",
        name: { $concat: ["$teacherData.firstName", " ", "$teacherData.lastName"] },
        documentCount: { $size: "$documentIds" },
        chunkCount: 1
      }
    },
    { $sort: { chunkCount: -1 } },
    { $limit: 10 }
  ]).toArray();

  // 5. Technical Metrics: Text vs Embedding
  const technicalMetrics = await db.collection("file_embeddings").aggregate([
    {
      $group: {
        _id: null,
        totalTextLength: { $sum: { $strLenCP: "$text" } },
        totalChunks: { $sum: 1 },
        uniqueDocuments: { $addToSet: "$referenced_file_id" }
      }
    },
    {
      $project: {
        _id: 0,
        avgChunkSize: { $cond: [{ $eq: ["$totalChunks", 0] }, 0, { $divide: ["$totalTextLength", "$totalChunks"] }] },
        avgChunksPerDoc: { $cond: [{ $eq: [{ $size: "$uniqueDocuments" }, 0] }, 0, { $divide: ["$totalChunks", { $size: "$uniqueDocuments" }] }] },
        totalTextLength: 1,
        totalChunks: 1,
        totalDocuments: { $size: "$uniqueDocuments" }
      }
    }
  ]).toArray();

  return {
    globalKpis,
    organizations: orgStats,
    technicalAnalysis: {
      heavySubjects,
      activeTeachers,
      topAiProducers: aiMaterialsByOrg
        .map(item => ({
          name: allOrgs.find(o => o._id.toString() === item._id.toString())?.name || "Sconosciuta",
          count: item.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      metrics: technicalMetrics[0] || { avgChunkSize: 0, avgChunksPerDoc: 0, totalTextLength: 0, totalChunks: 0, totalDocuments: 0 }
    }
  };
};

export const handler = lambdaRequest(getSuperAdminStats);
