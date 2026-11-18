/**
 * NOX GUARD — server-side policy primitives.
 * Import only from trusted server code. Never trust browser-supplied roles,
 * age bands, account status, or block lists.
 * Feature rules are injected from an approved server-side policy.
 * Missing/unknown policy data fails closed.
 */
const VALID_AGE_BANDS = new Set(["under_13", "13_14", "15_17", "18_plus", "unknown"]);

export function isTrustedAccountContext(context) {
  return Boolean(context && typeof context.authUserId === "string" &&
    context.authUserId.length > 0 && context.sessionValid === true &&
    context.accountStatus === "active" && VALID_AGE_BANDS.has(context.ageBand) &&
    Array.isArray(context.roles) &&
    context.roles.every((role) => ["user", "reviewer", "admin"].includes(role)));
}

/** Resolve access using trusted server-loaded context and approved server policy. */
export function authorizeFeature({ context, feature, policy }) {
  if (!isTrustedAccountContext(context))
    return { allowed: false, reason: "invalid_or_untrusted_account_context" };
  if (!policy || typeof policy !== "object" || !feature ||
      !Object.prototype.hasOwnProperty.call(policy, feature))
    return { allowed: false, reason: "feature_policy_missing" };
  const rule = policy[feature];
  if (!rule || typeof rule !== "object" || !Array.isArray(rule.allowedAgeBands) ||
      !Array.isArray(rule.requiredRoles))
    return { allowed: false, reason: "feature_policy_invalid" };
  if (!rule.enabled) return { allowed: false, reason: "feature_disabled" };
  if (!rule.allowedAgeBands.includes(context.ageBand))
    return { allowed: false, reason: "age_policy_restriction" };
  if (!rule.requiredRoles.every((role) => context.roles.includes(role)))
    return { allowed: false, reason: "insufficient_role" };
  return { allowed: true, reason: "allowed_by_server_policy" };
}

/** A block in either direction prevents interaction. */
export function isInteractionBlocked({ actorId, targetId, blockedPairs }) {
  if (!actorId || !targetId || actorId === targetId || !Array.isArray(blockedPairs)) return true;
  return blockedPairs.some((pair) => pair &&
    ((pair.blockerId === actorId && pair.blockedId === targetId) ||
     (pair.blockerId === targetId && pair.blockedId === actorId)));
}

export function validateReportInput(input) {
  const allowedReasons = new Set(["harassment", "spam", "impersonation", "unsafe_content", "other"]);
  if (!input || typeof input !== "object") return { valid: false, reason: "invalid_input" };
  if (typeof input.targetUserId !== "string" || input.targetUserId.length < 1 ||
      input.targetUserId.length > 36) return { valid: false, reason: "invalid_target" };
  if (!allowedReasons.has(input.reason)) return { valid: false, reason: "invalid_reason" };
  if (input.description !== undefined &&
      (typeof input.description !== "string" || input.description.length > 1000))
    return { valid: false, reason: "invalid_description" };
  return { valid: true };
}
