import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client, ID, Query, TablesDB } from "node-appwrite";
import { createModerationStore } from "../src/store.js";

const enabled = Boolean(process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID &&
  (process.env.NOX_MODERATION_API_KEY || process.env.APPWRITE_API_KEY) &&
  process.env.APPWRITE_DATABASE_ID);

test("friend request can be created, listed, accepted by recipient, and not accepted by sender", { skip: !enabled }, async () => {
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
  const senderId = ID.unique(), recipientId = ID.unique();
  const recipientNoxId = `TEST${randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const now = new Date().toISOString();
  let requestId, friendshipRowId;

  async function removeRows(tableId, queries) {
    const result = await db.listRows({ databaseId, tableId, queries: [...queries, Query.limit(100)] });
    for (const row of result.rows) await db.deleteRow({ databaseId, tableId, rowId: row.$id }).catch(() => {});
  }

  try {
    for (const [authUserId, noxId] of [[senderId, `SEND${randomUUID().replaceAll("-", "").slice(0, 12)}], [recipientId, recipientNoxId]]) {
      await db.createRow({ databaseId, tableId: "users", rowId: authUserId,
        data: { authUserId, noxId, displayName: "NOX Integration", createdAt: now }, permissions: [] });
    }

    const created = await store.createFriendRequest(senderId, recipientNoxId);
    assert.ok(created.requestId);
    assert.equal(created.status, "pending");
    requestId = created.requestId;

    const incoming = await store.listFriendRequests(recipientId, "incoming");
    const outgoing = await store.listFriendRequests(senderId, "outgoing");
    assert.ok(incoming.some(item => item.requestId === requestId));
    assert.ok(outgoing.some(item => item.requestId === requestId));

    const senderAttempt = await store.respondToFriendRequest(senderId, requestId, "accept");
    assert.equal(senderAttempt.error, "request_unavailable");

    const accepted = await store.respondToFriendRequest(recipientId, requestId, "accept");
    assert.equal(accepted.status, "accepted");
    assert.equal(accepted.replayed, false);

    const friends = await store.listFriendships(senderId);
    assert.ok(friends.some(item => item.userId === recipientId));

    const replay = await store.respondToFriendRequest(recipientId, requestId, "accept");
    assert.equal(replay.status, "accepted");
    assert.equal(replay.replayed, true);

    const friendshipPair = [senderId, recipientId].sort();
    const friendshipRows = await db.listRows({ databaseId, tableId: "friendships",
      queries: [Query.equal("userAId", friendshipPair[0]), Query.equal("userBId", friendshipPair[1]), Query.limit(1)] });
    friendshipRowId = friendshipRows.rows[0]?.$id;
  } finally {
    if (requestId) {
      await removeRows("notifications", [Query.equal("referenceId", requestId)]);
      await db.deleteRow({ databaseId, tableId: "friend_requests", rowId: requestId }).catch(() => {});
    }
    if (friendshipRowId) await db.deleteRow({ databaseId, tableId: "friendships", rowId: friendshipRowId }).catch(() => {});
    await db.deleteRow({ databaseId, tableId: "users", rowId: senderId }).catch(() => {});
    await db.deleteRow({ databaseId, tableId: "users", rowId: recipientId }).catch(() => {});
  }
});
