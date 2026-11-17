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
