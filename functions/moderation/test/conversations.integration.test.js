import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client, ID, Query, TablesDB } from "node-appwrite";
import { createModerationStore } from "../src/store.js";

const enabled = Boolean(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  (process.env.NOX_MODERATION_API_KEY || process.env.APPWRITE_API_KEY) &&
  process.env.APPWRITE_DATABASE_ID
);

test("private conversation supports member-only message send, read, and idempotent retry", { skip: !enabled }, async () => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.NOX_MODERATION_API_KEY || process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  process.env.APPWRITE_FUNCTION_API_ENDPOINT = endpoint;
  process.env.APPWRITE_FUNCTION_PROJECT_ID = projectId;
  process.env.NOX_MODERATION_API_KEY = apiKey;
  process.env.NOX_DATABASE_ID = databaseId;

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const db = new TablesDB(client);
  const store = createModerationStore();

  const userAId = ID.unique();
  const userBId = ID.unique();
  const outsiderId = ID.unique();
  const pair = [userAId, userBId].sort();
  const friendshipId = ID.unique();
  const now = new Date().toISOString();
  let conversationId;

  async function removeRows(tableId, queries) {
    const result = await db.listRows({ databaseId, tableId, queries: [...queries, Query.limit(100)] });
    for (const row of result.rows) {
      await db.deleteRow({ databaseId, tableId, rowId: row.$id });
    }
  }

  try {
    for (const [authUserId, suffix] of [[userAId, "a"], [userBId, "b"]]) {
      await db.createRow({
        databaseId, tableId: "users", rowId: authUserId,
        data: {
          authUserId,
          noxId: `TEST${suffix.toUpperCase()}${randomUUID().replaceAll("-", "").slice(0, 12)}`,
          displayName: `NOX Integration ${suffix.toUpperCase()}`,
          createdAt: now
        },
        permissions: []
      });
    }

    await db.createRow({
      databaseId, tableId: "friendships", rowId: friendshipId,
      data: { userAId: pair[0], userBId: pair[1], createdAt: now },
      permissions: []
    });

    const created = await store.createOrGetConversation(userAId, userBId);
    assert.ok(created.conversationId);
    conversationId = created.conversationId;

    const memberRows = await db.listRows({
      databaseId, tableId: "conversation_members",
      queries: [Query.equal("conversationId", conversationId), Query.limit(10)]
    });
    assert.equal(memberRows.rows.length, 2);
    assert.deepEqual(new Set(memberRows.rows.map(row => row.userId)), new Set([userAId, userBId]));

    const idempotencyKey = randomUUID();
    const first = await store.sendMessage(userAId, conversationId, "NOX integration test message", idempotencyKey);
    assert.equal(first.error, undefined);
    assert.equal(first.replayed, false);

    const retry = await store.sendMessage(userAId, conversationId, "NOX integration test message", idempotencyKey);
    assert.equal(retry.replayed, true);
    assert.equal(retry.message.messageId, first.message.messageId);

    const visibleToA = await store.listMessages(userAId, conversationId);
    const visibleToB = await store.listMessages(userBId, conversationId);
    assert.equal(visibleToA.messages.length, 1);
    assert.equal(visibleToB.messages.length, 1);
    assert.equal(visibleToB.messages[0].body, "NOX integration test message");

    const outsiderRead = await store.listMessages(outsiderId, conversationId);
    assert.equal(outsiderRead.error, "conversation_unavailable");
    const outsiderSend = await store.sendMessage(outsiderId, conversationId, "unauthorized", randomUUID());
    assert.equal(outsiderSend.error, "conversation_unavailable");
  } finally {
    if (conversationId) {
      await removeRows("messages", [Query.equal("conversationId", conversationId)]);
      await removeRows("conversation_members", [Query.equal("conversationId", conversationId)]);
      await db.deleteRow({ databaseId, tableId: "conversations", rowId: conversationId }).catch(() => {});
    }
    await db.deleteRow({ databaseId, tableId: "friendships", rowId: friendshipId }).catch(() => {});
    await db.deleteRow({ databaseId, tableId: "users", rowId: userAId }).catch(() => {});
    await db.deleteRow({ databaseId, tableId: "users", rowId: userBId }).catch(() => {});
  }
});
