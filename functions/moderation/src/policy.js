export const REPORT_REASONS = new Set([
  "harassment",
  "threats",
  "spam",
  "impersonation",
  "privacy",
  "scam",
  "other"
]);

export const CONTENT_TYPES = new Set([
  "account",
  "message",
  "profile"
]);

export function isValidId(value) {
  return typeof value === "string"
    && value.length >= 1
    && value.length <= 36
    && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

export function validateReportInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_body" };
  }

  const { targetUserId, contentType, contentId, reason, description } = input;

  if (!isValidId(targetUserId)) {
    return { ok: false, error: "invalid_target" };
  }

  if (!CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: "invalid_content_type" };
  }

  if (contentType !== "account" && !isValidId(contentId)) {
    return { ok: false, error: "invalid_content_id" };
  }

  if (!REPORT_REASONS.has(reason)) {
    return { ok: false, error: "invalid_reason" };
  }

  if (description !== undefined
      && (typeof description !== "string" || description.length > 1000)) {
    return { ok: false, error: "invalid_description" };
  }

  return {
    ok: true,
    value: {
      targetUserId,
      contentType,
      ...(contentType === "account" ? {} : { contentId }),
      reason,
      description: (description ?? "").trim()
    }
  };
}

export function validateBlockTarget(targetUserId, callerUserId) {
  if (!isValidId(targetUserId)) return { ok: false, error: "invalid_target" };
  if (targetUserId === callerUserId) return { ok: false, error: "cannot_block_self" };
  return { ok: true, value: targetUserId };
}

/**
 * Moderator identities are provisioned out-of-band by the project owner as a
 * protected Function environment variable. Never accept role claims from clients.
 */
export function isModerator(userId, configuredIds = "") {
  if (!isValidId(userId) || typeof configuredIds !== "string") return false;
  const allowed = new Set(
    configuredIds.split(",").map((id) => id.trim()).filter(isValidId)
  );
  return allowed.has(userId);
}


/**
 * Shared server-side guard for friend requests and private conversations.
 * The callback must query the private blocks table, never client-supplied data.
 */
export async function isBlockedEitherWay(userAId, userBId, findBlock) {
  if (!isValidId(userAId) || !isValidId(userBId) || userAId === userBId) {
    throw new Error("invalid_user_pair");
  }
  if (typeof findBlock !== "function") throw new Error("missing_block_lookup");
  const [aBlockedB, bBlockedA] = await Promise.all([
    findBlock(userAId, userBId),
    findBlock(userBId, userAId)
  ]);
  return Boolean(aBlockedB || bBlockedA);
}


export function validateNoxId(value) {
  if (typeof value !== "string") return { ok: false, error: "invalid_nox_id" };
  const noxId = value.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,32}$/.test(noxId)) return { ok: false, error: "invalid_nox_id" };
  return { ok: true, value: noxId };
}

export function validateRequestId(value) {
  return isValidId(value)
    ? { ok: true, value }
    : { ok: false, error: "invalid_request_id" };
}


export function canonicalFriendPair(userAId, userBId) {
  if (!isValidId(userAId) || !isValidId(userBId) || userAId === userBId) {
    return { ok: false, error: "invalid_user_pair" };
  }
  const [first, second] = [userAId, userBId].sort();
  return { ok: true, userAId: first, userBId: second };
}

export function canRespondToFriendRequest(request, callerId, decision) {
  if (!request || typeof request !== "object" || request.status !== "pending") return false;
  if (request.recipientId !== callerId) return false;
  return decision === "accept" || decision === "decline";
}

export function canCancelFriendRequest(request, callerId) {
  return Boolean(request && request.status === "pending" && request.senderId === callerId);
}


export function validateMessageBody(value) {
  if (typeof value !== "string") return { ok: false, error: "invalid_message" };
  const body = value.trim();
  if (!body || body.length > 4000) return { ok: false, error: "invalid_message" };
  return { ok: true, value: body };
}

export function canAccessConversation(conversation, callerId, otherUserId) {
  if (!conversation || !isValidId(callerId) || !isValidId(otherUserId) || callerId === otherUserId) return false;
  const pair = canonicalFriendPair(callerId, otherUserId);
  return pair.ok && conversation.participantAId === pair.userAId && conversation.participantBId === pair.userBId;
}

export function canReadOrSendMessage(conversation, callerId) {
  return Boolean(conversation && (conversation.participantAId === callerId || conversation.participantBId === callerId));
}
