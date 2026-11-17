import { Client, ID, Query, TablesDB } from "node-appwrite";
import { isBlockedEitherWay } from "./policy.js";

const DATABASE_ID = process.env.NOX_DATABASE_ID || "6afc583f00382386b997";

export function createModerationStore() {
  const apiKey = process.env.NOX_MODERATION_API_KEY;
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;

  if (!apiKey || !endpoint || !projectId) {
    throw new Error("Moderation storage is not configured");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const db = new TablesDB(client);

  async function findUser(authUserId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "users",
      queries: [Query.equal("authUserId", authUserId), Query.limit(1)]
    });
    return result.rows[0] ?? null;
  }

  async function createBlock(blockerId, blockedId) {
    if (!(await findUser(blockedId))) {
      return { created: false, error: "target_not_found" };
    }
    try {
      await db.createRow({
        databaseId: DATABASE_ID,
        tableId: "blocks",
        rowId: ID.unique(),
        data: { blockerId, blockedId, createdAt: new Date().toISOString() },
        permissions: []
      });
      return { created: true };
    } catch (error) {
      if (error?.code === 409 || error?.type === "document_already_exists") {
        return { created: false, alreadyExists: true };
      }
      throw error;
    }
  }

  async function removeBlock(blockerId, blockedId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "blocks",
      queries: [
        Query.equal("blockerId", blockerId),
        Query.equal("blockedId", blockedId),
        Query.limit(1)
      ]
    });
    const row = result.rows[0];
    if (!row) return false;
    await db.deleteRow({
      databaseId: DATABASE_ID,
      tableId: "blocks",
      rowId: row.$id
    });
    return true;
  }

  async function findBlock(blockerId, blockedId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "blocks",
      queries: [
        Query.equal("blockerId", blockerId),
        Query.equal("blockedId", blockedId),
        Query.limit(1)
      ]
    });
    return result.rows.length > 0;
  }

  async function isBlocked(userAId, userBId) {
    return isBlockedEitherWay(userAId, userBId, findBlock);
  }

  async function listBlocks(blockerId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "blocks",
      queries: [
        Query.equal("blockerId", blockerId),
        Query.limit(100)
      ]
    });
    return result.rows.map((row) => ({
      blockedUserId: row.blockedId,
      createdAt: row.createdAt
    }));
  }

  async function createReport(reporterId, report) {
    if (!(await findUser(report.targetUserId))) {
      return { created: false, error: "target_not_found" };
    }
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recent = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "reports",
      queries: [
        Query.equal("reporterId", reporterId),
        Query.greaterThan("createdAt", windowStart),
        Query.limit(5)
      ]
    });
    if (recent.rows.length >= 5) {
      return { created: false, error: "report_rate_limited" };
    }
    const now = new Date().toISOString();
    const row = await db.createRow({
      databaseId: DATABASE_ID,
      tableId: "reports",
      rowId: ID.unique(),
      data: {
        reporterId,
        targetUserId: report.targetUserId,
        contentType: "account",
        reason: report.reason,
        description: report.description,
        status: "new",
        createdAt: now,
        updatedAt: now
      },
      permissions: []
    });
    return { created: true, reportId: row.$id, status: row.status };
  }

  async function listReports(reporterId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "reports",
      queries: [
        Query.equal("reporterId", reporterId),
        Query.limit(100)
      ]
    });
    return result.rows.map((row) => ({
      reportId: row.$id,
      targetUserId: row.targetUserId,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  return { createBlock, removeBlock, listBlocks, isBlocked, createReport, listReports };
}
