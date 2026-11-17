import { Client, ID, Query, TablesDB } from "node-appwrite";
import { isBlockedEitherWay, canonicalFriendPair, canRespondToFriendRequest, canCancelFriendRequest, canReadOrSendMessage, validateMessageBody } from "./policy.js";

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

  async function findUserByNoxId(noxId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "users",
      queries: [Query.equal("noxId", noxId), Query.limit(1)]
    });
    return result.rows[0] ?? null;
  }

  async function lookupPublicProfile(noxId) {
    const user = await findUserByNoxId(noxId);
    if (!user) return null;
    return { noxId: user.noxId, displayName: user.displayName };
  }

  async function createNotification(recipientId, type, referenceId) {
    await db.createRow({
      databaseId: DATABASE_ID, tableId: "notifications", rowId: ID.unique(),
      data: { recipientId, type, referenceId, isRead: false, createdAt: new Date().toISOString() },
      permissions: []
    });
  }

  async function listNotifications(userId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "notifications",
      queries: [Query.equal("recipientId", userId), Query.orderDesc("createdAt"), Query.limit(100)]
    });
    return result.rows.map(row => ({
      notificationId: row.$id, type: row.type, referenceId: row.referenceId ?? null,
      isRead: row.isRead, createdAt: row.createdAt
    }));
  }

  async function markNotificationRead(userId, notificationId) {
    const row = await db.getRow({ databaseId: DATABASE_ID, tableId: "notifications", rowId: notificationId });
    if (row.recipientId !== userId) return { error: "notification_unavailable" };
    if (!row.isRead) {
      await db.updateRow({ databaseId: DATABASE_ID, tableId: "notifications", rowId: notificationId, data: { isRead: true } });
    }
    return { isRead: true };
  }

  async function createFriendRequest(senderId, noxId) {
    const recipient = await findUserByNoxId(noxId);
    if (!recipient) return { error: "user_not_found" };
    const recipientId = recipient.authUserId;
    if (typeof recipientId !== "string" || !recipientId) return { error: "user_not_found" };
    if (recipientId === senderId) return { error: "cannot_request_self" };
    if (await isBlocked(senderId, recipientId)) return { error: "interaction_unavailable" };

    const [existingFriendship, outgoing, incoming] = await Promise.all([
      db.listRows({ databaseId: DATABASE_ID, tableId: "friendships", queries: [
        Query.or([Query.and([Query.equal("userAId", senderId), Query.equal("userBId", recipientId)]),
          Query.and([Query.equal("userAId", recipientId), Query.equal("userBId", senderId)])]), Query.limit(1)
      ]}),
      db.listRows({ databaseId: DATABASE_ID, tableId: "friend_requests", queries: [
        Query.equal("senderId", senderId), Query.equal("recipientId", recipientId),
        Query.equal("status", "pending"), Query.limit(1)
      ]}),
      db.listRows({ databaseId: DATABASE_ID, tableId: "friend_requests", queries: [
        Query.equal("senderId", recipientId), Query.equal("recipientId", senderId),
        Query.equal("status", "pending"), Query.limit(1)
      ]})
    ]);
    if (existingFriendship.rows.length) return { error: "already_friends" };
    if (outgoing.rows.length) return { error: "request_already_pending", requestId: outgoing.rows[0].$id };
    if (incoming.rows.length) return { error: "incoming_request_pending", requestId: incoming.rows[0].$id };

    const now = new Date().toISOString();
    const row = await db.createRow({
      databaseId: DATABASE_ID, tableId: "friend_requests", rowId: ID.unique(),
      data: { senderId, recipientId, status: "pending", createdAt: now, updatedAt: now },
      permissions: []
    });
    await createNotification(recipientId, "friend_request", row.$id);
    return { requestId: row.$id, status: row.status };
  }

  async function listFriendRequests(userId, direction) {
    const field = direction === "incoming" ? "recipientId" : "senderId";
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "friend_requests",
      queries: [Query.equal(field, userId), Query.equal("status", "pending"), Query.orderDesc("createdAt"), Query.limit(100)]
    });
    return result.rows.map(row => ({
      requestId: row.$id,
      userId: direction === "incoming" ? row.senderId : row.recipientId,
      direction,
      createdAt: row.createdAt
    }));
  }

  async function respondToFriendRequest(userId, requestId, decision) {
    const row = await db.getRow({ databaseId: DATABASE_ID, tableId: "friend_requests", rowId: requestId });
    if (!canRespondToFriendRequest(row, userId, decision)) return { error: "request_unavailable" };
    if (await isBlocked(row.senderId, row.recipientId)) return { error: "interaction_unavailable" };
    const now = new Date().toISOString();
    if (decision === "decline") {
      await db.updateRow({ databaseId: DATABASE_ID, tableId: "friend_requests", rowId: requestId,
        data: { status: "declined", updatedAt: now } });
      return { status: "declined" };
    }
    const pair = canonicalFriendPair(row.senderId, row.recipientId);
    if (!pair.ok) return { error: "request_unavailable" };
    const { userAId, userBId } = pair;
    try {
      await db.createRow({ databaseId: DATABASE_ID, tableId: "friendships", rowId: ID.unique(),
        data: { userAId, userBId, createdAt: now }, permissions: [] });
    } catch (error) {
      if (error?.code !== 409 && error?.type !== "document_already_exists") throw error;
    }
    await db.updateRow({ databaseId: DATABASE_ID, tableId: "friend_requests", rowId: requestId,
      data: { status: "accepted", updatedAt: now } });
    await createNotification(row.senderId, "friend_request_accepted", requestId);
    return { status: "accepted" };
  }

  async function cancelFriendRequest(userId, requestId) {
    const row = await db.getRow({ databaseId: DATABASE_ID, tableId: "friend_requests", rowId: requestId });
    if (!canCancelFriendRequest(row, userId)) return { error: "request_unavailable" };
    await db.updateRow({ databaseId: DATABASE_ID, tableId: "friend_requests", rowId: requestId,
      data: { status: "cancelled", updatedAt: new Date().toISOString() } });
    return { status: "cancelled" };
  }

  async function listFriendships(userId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "friendships",
      queries: [Query.or([Query.equal("userAId", userId), Query.equal("userBId", userId)]), Query.limit(100)]
    });
    return result.rows.map(row => ({ userId: row.userAId === userId ? row.userBId : row.userAId, createdAt: row.createdAt }));
  }


  async function findFriendship(userAId, userBId) {
    const pair = canonicalFriendPair(userAId, userBId);
    if (!pair.ok) return null;
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "friendships",
      queries: [Query.equal("userAId", pair.userAId), Query.equal("userBId", pair.userBId), Query.limit(1)]
    });
    return result.rows[0] ?? null;
  }

  async function findConversation(userAId, userBId) {
    const pair = canonicalFriendPair(userAId, userBId);
    if (!pair.ok) return null;
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "conversations",
      queries: [Query.equal("participantAId", pair.userAId), Query.equal("participantBId", pair.userBId), Query.limit(1)]
    });
    return result.rows[0] ?? null;
  }

  async function createOrGetConversation(callerId, friendUserId) {
    if (typeof friendUserId !== "string" || !friendUserId || friendUserId === callerId) {
      return { error: "invalid_friend" };
    }
    if (await isBlocked(callerId, friendUserId)) return { error: "interaction_unavailable" };
    if (!(await findFriendship(callerId, friendUserId))) return { error: "friendship_required" };
    const pair = canonicalFriendPair(callerId, friendUserId);
    if (!pair.ok) return { error: "invalid_friend" };
    let conversation = await findConversation(callerId, friendUserId);
    if (!conversation) {
      const now = new Date().toISOString();
      try {
        conversation = await db.createRow({
          databaseId: DATABASE_ID, tableId: "conversations", rowId: ID.unique(),
          data: { participantAId: pair.userAId, participantBId: pair.userBId, createdAt: now, updatedAt: now },
          permissions: []
        });
      } catch (error) {
        if (error?.code !== 409 && error?.type !== "document_already_exists") throw error;
        conversation = await findConversation(callerId, friendUserId);
        if (!conversation) throw error;
      }
    }
    return { conversationId: conversation.$id, friendUserId, createdAt: conversation.createdAt, lastMessageAt: conversation.lastMessageAt ?? null };
  }

  async function listConversations(callerId) {
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "conversations",
      queries: [Query.or([Query.equal("participantAId", callerId), Query.equal("participantBId", callerId)]), Query.orderDesc("lastMessageAt"), Query.limit(100)]
    });
    const visible = await Promise.all(result.rows.map(async row => {
      const friendUserId = row.participantAId === callerId ? row.participantBId : row.participantAId;
      const [blocked, friendship] = await Promise.all([
        isBlocked(callerId, friendUserId),
        findFriendship(callerId, friendUserId)
      ]);
      if (blocked || !friendship) return null;
      return {
        conversationId: row.$id,
        friendUserId,
        createdAt: row.createdAt,
        lastMessageAt: row.lastMessageAt ?? null
      };
    }));
    return visible.filter(Boolean);
  }

  async function getAuthorizedConversation(callerId, conversationId) {
    const conversation = await db.getRow({ databaseId: DATABASE_ID, tableId: "conversations", rowId: conversationId });
    if (!canReadOrSendMessage(conversation, callerId)) return { error: "conversation_unavailable" };
    const friendUserId = conversation.participantAId === callerId ? conversation.participantBId : conversation.participantAId;
    if (await isBlocked(callerId, friendUserId)) return { error: "interaction_unavailable" };
    if (!(await findFriendship(callerId, friendUserId))) return { error: "friendship_required" };
    return { conversation, friendUserId };
  }

  async function listMessages(callerId, conversationId) {
    const access = await getAuthorizedConversation(callerId, conversationId);
    if (access.error) return access;
    const result = await db.listRows({
      databaseId: DATABASE_ID, tableId: "messages",
      queries: [Query.equal("conversationId", conversationId), Query.orderDesc("createdAt"), Query.limit(50)]
    });
    return { messages: result.rows.reverse().map(row => ({
      messageId: row.$id, senderId: row.senderId, body: row.body, createdAt: row.createdAt
    })) };
  }

  async function sendMessage(callerId, conversationId, rawBody) {
    const checked = validateMessageBody(rawBody);
    if (!checked.ok) return { error: checked.error };
    const access = await getAuthorizedConversation(callerId, conversationId);
    if (access.error) return access;
    const windowStart = new Date(Date.now() - 60 * 1000).toISOString();
    const recent = await db.listRows({
      databaseId: DATABASE_ID, tableId: "messages",
      queries: [Query.equal("senderId", callerId), Query.greaterThan("createdAt", windowStart), Query.limit(30)]
    });
    if (recent.rows.length >= 30) return { error: "message_rate_limited" };
    const now = new Date().toISOString();
    const row = await db.createRow({
      databaseId: DATABASE_ID, tableId: "messages", rowId: ID.unique(),
      data: { conversationId, senderId: callerId, body: checked.value, createdAt: now },
      permissions: []
    });
    await db.updateRow({
      databaseId: DATABASE_ID, tableId: "conversations", rowId: conversationId,
      data: { updatedAt: now, lastMessageAt: now }
    });
    return { message: { messageId: row.$id, senderId: callerId, body: row.body, createdAt: row.createdAt } };
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

  return { createBlock, removeBlock, listBlocks, isBlocked, createReport, listReports, createFriendRequest, listFriendRequests, respondToFriendRequest, cancelFriendRequest, listFriendships, lookupPublicProfile, listNotifications, markNotificationRead, createOrGetConversation, listConversations, listMessages, sendMessage };
}
