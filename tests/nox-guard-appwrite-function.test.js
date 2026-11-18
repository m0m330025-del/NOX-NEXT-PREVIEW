import test from "node:test";
import assert from "node:assert/strict";
import { createNoxGuardHandler } from "../server/nox-guard/appwrite-function.js";

function harness({ profile = null, target = null } = {}) {
  const rows = { users: [], reports: [], blocks: [] };
  if (profile) rows.users.push({ $id: "profile-1", authUserId: "auth-1", oxId: "NX1", displayName: "User", ageBand: "unknown", accountStatus: "active", role: "user", ...profile });
  if (target) rows.users.push({ $id: "profile-2", authUserId: "auth-2", oxId: "NX2", displayName: "Target", ageBand: "unknown", accountStatus: "active", role: "user", ...target });
  const db = {
    async listRows(table, filters) {
      return rows[table].filter(row => Object.entries(filters).every(([key, value]) => String(row[key]) === String(value)));
    },
    async getRow(table, id) { const row = rows[table].find(item => item.$id === id); if (!row) throw new Error("not found"); return row; },
    async createRow(table, data) { const row = { $id: "created-" + (rows[table].length + 1), ...data }; rows[table].push(row); return row; },
    async deleteRow(table, id) { rows[table] = rows[table].filter(row => row.$id !== id); }
  };
  const handler = createNoxGuardHandler({
    authenticate: async () => ({ $id: "auth-1" }), db,
    now: () => new Date("2026-11-18T00:00:00.000Z"), id: () => "unique-nox-id"
  });
  async function invoke({ action, method = "GET", bodyJson = {}, query = {} }) {
    let status = 200, payload;
    const res = { json(value, code = 200) { payload = value; status = code; return { status, payload }; } };
    await handler({ req: { method, bodyJson, query: { action, ...query } }, res, log() {}, error() {} });
    return { status, payload, rows };
  }
  return { invoke, rows };
}

test("creates a pending profile with unknown age and server-assigned user role", async () => {
  const h = harness();
  const result = await h.invoke({ action: "profile", method: "POST", bodyJson: { displayName: "New User", ageBand: "18_plus", role: "admin" } });
  assert.equal(result.status, 201);
  assert.equal(result.rows.users[0].ageBand, "unknown");
  assert.equal(result.rows.users[0].accountStatus, "pending_review");
  assert.equal(result.rows.users[0].role, "user");
  assert.equal(result.rows.users[0].oxId, "NXUNIQUE-NOX-ID");
  assert.equal(result.payload.profile.noxId, result.rows.users[0].oxId);
  assert.equal("ageBand" in result.payload.profile, false);
});

test("rejects invalid profile display names", async () => {
  const result = await harness().invoke({ action: "profile", method: "POST", bodyJson: { displayName: "x" } });
  assert.equal(result.status, 400);
});

test("creates reports using the authenticated reporter profile, not client identity", async () => {
  const h = harness({ profile: {}, target: {} });
  const result = await h.invoke({ action: "report", method: "POST", bodyJson: { targetUserId: "profile-2", reason: "spam", reporterId: "forged" } });
  assert.equal(result.status, 201);
  assert.equal(result.rows.reports[0].reporterId, "profile-1");
});

test("blocks and unblocks only the authenticated user's own relationship", async () => {
  const h = harness({ profile: {}, target: {} });
  const created = await h.invoke({ action: "block", method: "POST", bodyJson: { targetUserId: "profile-2" } });
  assert.equal(created.status, 201);
  const removed = await h.invoke({ action: "unblock", method: "POST", bodyJson: { targetUserId: "profile-2" } });
  assert.equal(removed.status, 200);
  assert.equal(h.rows.blocks.length, 0);
});

test("rejects self-reporting and self-blocking", async () => {
  const h = harness({ profile: {} });
  assert.equal((await h.invoke({ action: "block", method: "POST", bodyJson: { targetUserId: "profile-1" } })).status, 400);
  assert.equal((await h.invoke({ action: "report", method: "POST", bodyJson: { targetUserId: "profile-1", reason: "spam" } })).status, 400);
});

test("block-check detects a block in either direction", async () => {
  const h = harness({ profile: {}, target: {} });
  h.rows.blocks.push({ $id: "b1", blockerId: "profile-2", blockedId: "profile-1" });
  const result = await h.invoke({ action: "block-check", method: "GET", query: { targetUserId: "profile-2" } });
  assert.equal(result.payload.blocked, true);
});

test("profile creation is idempotent for an existing authenticated user", async () => {
  const h = harness({ profile: {} });
  const result = await h.invoke({ action: "profile", method: "POST", bodyJson: { displayName: "Changed" } });
  assert.equal(result.status, 200);
  assert.equal(result.payload.existing, true);
  assert.equal(h.rows.users.length, 1);
});
