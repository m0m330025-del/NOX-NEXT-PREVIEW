import { Client, Account, TablesDB, Query, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6afc583f00382386b997";
const USERS = "users";
const REPORTS = "reports";
const BLOCKS = "blocks";
const json = (res, body, status = 200) => res.json(body, status);

export function createNoxGuardHandler({ authenticate, db, now = () => new Date(), id = () => ID.unique() }) {
  async function profileFor(authUserId) {
    const rows = await db.listRows(USERS, { authUserId });
    return rows[0] || null;
  }
  async function targetProfile(targetId) {
    try { return await db.getRow(USERS, targetId); } catch (_) { return null; }
  }

  return async ({ req, res, log, error }) => {
    try {
      const action = String(req.query?.action || req.bodyJson?.action || "").toLowerCase();
      const method = String(req.method || "GET").toUpperCase();
      if (!action) return json(res, { ok: false, error: "action_required" }, 400);
      const user = await authenticate(req);
      if (!user?.$id) return json(res, { ok: false, error: "authentication_required" }, 401);

      if (action === "profile" && method === "POST") {
        const existing = await profileFor(user.$id);
        if (existing) return json(res, { ok: true, profile: publicProfile(existing), existing: true });
        const displayName = typeof req.bodyJson?.displayName === "string" ? req.bodyJson.displayName.trim() : "";
        if (displayName.length < 2 || displayName.length > 40)
          return json(res, { ok: false, error: "invalid_display_name" }, 400);
        const created = await db.createRow(USERS, {
          authUserId: user.$id,
          noxId: "NX" + id().replace(/[^a-zA-Z0-9]/g, "").slice(0, 18).toUpperCase(),
          displayName,
          ageBand: "unknown",
          accountStatus: "pending_review",
          role: "user",
          createdAt: now().toISOString()
        });
        return json(res, { ok: true, profile: publicProfile(created), existing: false }, 201);
      }

      const profile = await profileFor(user.$id);
      if (!profile) return json(res, { ok: false, error: "profile_not_initialized" }, 404);
      if (!["active", "pending_review"].includes(profile.accountStatus))
        return json(res, { ok: false, error: "account_unavailable" }, 403);

      if (action === "me" && method === "GET")
        return json(res, { ok: true, profile: publicProfile(profile) });

      if (action === "report" && method === "POST") {
        const input = req.bodyJson || {};
        const targetId = input.targetUserId;
        const reasons = ["harassment", "spam", "impersonation", "unsafe_content", "other"];
        if (typeof targetId !== "string" || targetId.length < 1 || targetId.length > 36 ||
            targetId === profile.$id || !reasons.includes(input.reason) ||
            (input.description !== undefined &&
             (typeof input.description !== "string" || input.description.length > 1000)))
          return json(res, { ok: false, error: "invalid_report" }, 400);
        if (!await targetProfile(targetId))
          return json(res, { ok: false, error: "target_not_found" }, 404);
        const created = await db.createRow(REPORTS, {
          reporterId: profile.$id,
          targetUserId: targetId,
          contentType: "user",
          reason: input.reason,
          ...(input.description ? { description: input.description.trim() } : {}),
          status: "open",
          createdAt: now().toISOString(),
          updatedAt: now().toISOString()
        });
        return json(res, { ok: true, reportId: created.$id }, 201);
      }

      if (action === "block" && method === "POST") {
        const targetId = req.bodyJson?.targetUserId;
        if (typeof targetId !== "string" || targetId.length < 1 || targetId.length > 36 || targetId === profile.$id)
          return json(res, { ok: false, error: "invalid_target" }, 400);
        if (!await targetProfile(targetId))
          return json(res, { ok: false, error: "target_not_found" }, 404);
        const existing = await db.listRows(BLOCKS, [
          { blockerId: profile.$id, blockedId: targetId }
        ]);
        if (existing.length) return json(res, { ok: true, blocked: true, existing: true });
        const created = await db.createRow(BLOCKS, {
          blockerId: profile.$id, blockedId: targetId, createdAt: now().toISOString()
        });
        return json(res, { ok: true, blocked: true, existing: false, blockId: created.$id }, 201);
      }

      if (action === "unblock" && method === "POST") {
        const targetId = req.bodyJson?.targetUserId;
        if (typeof targetId !== "string" || targetId.length < 1 || targetId.length > 36)
          return json(res, { ok: false, error: "invalid_target" }, 400);
        const existing = await db.listRows(BLOCKS, [
          Query.equal("blockerId", profile.$id), Query.equal("blockedId", targetId)
        ]);
        for (const row of existing) await db.deleteRow(BLOCKS, row.$id);
        return json(res, { ok: true, blocked: false });
      }

      if (action === "block-check" && method === "GET") {
        const targetId = String(req.query?.targetUserId || "");
        if (!targetId || targetId.length > 36 || targetId === profile.$id)
          return json(res, { ok: false, error: "invalid_target" }, 400);
        const [outgoing, incoming] = await Promise.all([
          db.listRows(BLOCKS, [Query.equal("blockerId", profile.$id), Query.equal("blockedId", targetId)]),
          db.listRows(BLOCKS, [{ blockerId: targetId, blockedId: profile.$id }])
        ]);
        return json(res, { ok: true, blocked: outgoing.length > 0 || incoming.length > 0 });
      }

      return json(res, { ok: false, error: "unsupported_action" }, 404);
    } catch (cause) {
      error?.("NOX GUARD request failed: " + String(cause?.message || "unknown error"));
      log?.("NOX GUARD returned a generic server error.");
      return json(res, { ok: false, error: "internal_error" }, 500);
    }
  };
}

function publicProfile(row) {
  return {
    id: row.$id, noxId: row.noxId, displayName: row.displayName,
    accountStatus: row.accountStatus, ageBand: row.ageBand, role: row.role
  };
}

export default async function ({ req, res, log, error }) {
  const jwt = req.headers?.["x-appwrite-user-jwt"];
  const invokingUserId = req.headers?.["x-appwrite-user-id"];
  const ephemeralKey = req.headers?.["x-appwrite-key"];
  if (!jwt || !invokingUserId || !ephemeralKey)
    return json(res, { ok: false, error: "authenticated_function_context_required" }, 401);

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const userClient = new Client().setEndpoint(endpoint)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setJWT(jwt);
  const account = new Account(userClient);
  const adminClient = new Client().setEndpoint(endpoint)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(ephemeralKey);
  const tables = new TablesDB(adminClient);

  const db = {
    async listRows(tableId, filters) {
      const queries = Object.entries(filters).map(([key, value]) => Query.equal(key, value));
      const result = await tables.listRows({ databaseId: DATABASE_ID, tableId, queries, total: false });
      return result.rows;
    },
    getRow(tableId, rowId) { return tables.getRow({ databaseId: DATABASE_ID, tableId, rowId }); },
    createRow(tableId, data) {
      return tables.createRow({ databaseId: DATABASE_ID, tableId, rowId: ID.unique(), data, permissions: [] });
    },
    deleteRow(tableId, rowId) { return tables.deleteRow({ databaseId: DATABASE_ID, tableId, rowId }); }
  };

  const handler = createNoxGuardHandler({
    db,
    authenticate: async () => {
      const verified = await account.get();
      return verified.$id === invokingUserId ? verified : null;
    }
  });
  return handler({ req, res, log, error });
}
