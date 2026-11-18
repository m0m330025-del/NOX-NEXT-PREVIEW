import test from "node:test";
import assert from "node:assert/strict";
import { authorizeFeature, isInteractionBlocked, isTrustedAccountContext, validateReportInput } from "../server/nox-guard/policy.js";

const context = { authUserId: "auth-user-1", sessionValid: true, accountStatus: "active", ageBand: "15_17", roles: ["user"] };
const policy = {
  community_feed: { enabled: true, allowedAgeBands: ["13_14", "15_17", "18_plus"], requiredRoles: ["user"] },
  private_feature: { enabled: true, allowedAgeBands: ["18_plus"], requiredRoles: ["user"] }
};

test("accepts a complete server-loaded account context", () => assert.equal(isTrustedAccountContext(context), true));
test("rejects invalid session, age band, role, and account status", () => {
  assert.equal(isTrustedAccountContext({ ...context, sessionValid: false }), false);
  assert.equal(isTrustedAccountContext({ ...context, ageBand: "adult" }), false);
  assert.equal(isTrustedAccountContext({ ...context, roles: ["admin", "owner"] }), false);
  assert.equal(isTrustedAccountContext({ ...context, accountStatus: "suspended" }), false);
});
test("allows a feature only when server policy explicitly allows it", () => {
  assert.deepEqual(authorizeFeature({ context, feature: "community_feed", policy }), { allowed: true, reason: "allowed_by_server_policy" });
});
test("denies missing policy and age-restricted feature access", () => {
  assert.equal(authorizeFeature({ context, feature: "missing", policy }).allowed, false);
  assert.equal(authorizeFeature({ context, feature: "private_feature", policy }).reason, "age_policy_restriction");
});
test("denies disabled features and missing required roles", () => {
  const disabled = { test: { enabled: false, allowedAgeBands: ["15_17"], requiredRoles: ["user"] } };
  assert.equal(authorizeFeature({ context, feature: "test", policy: disabled }).reason, "feature_disabled");
  const reviewerOnly = { test: { enabled: true, allowedAgeBands: ["15_17"], requiredRoles: ["reviewer"] } };
  assert.equal(authorizeFeature({ context, feature: "test", policy: reviewerOnly }).reason, "insufficient_role");
});
test("blocks interaction if either user has blocked the other", () => {
  const pairs = [{ blockerId: "auth-user-1", blockedId: "auth-user-2" }];
  assert.equal(isInteractionBlocked({ actorId: "auth-user-1", targetId: "auth-user-2", blockedPairs: pairs }), true);
  assert.equal(isInteractionBlocked({ actorId: "auth-user-2", targetId: "auth-user-1", blockedPairs: pairs }), true);
  assert.equal(isInteractionBlocked({ actorId: "auth-user-1", targetId: "auth-user-3", blockedPairs: pairs }), false);
});
test("fails closed for malformed block context and self-interaction", () => {
  assert.equal(isInteractionBlocked({ actorId: "same", targetId: "same", blockedPairs: [] }), true);
  assert.equal(isInteractionBlocked({ actorId: "a", targetId: "b", blockedPairs: null }), true);
});
test("validates minimal report payloads and rejects unknown reason codes", () => {
  assert.equal(validateReportInput({ targetUserId: "user-2", reason: "spam" }).valid, true);
  assert.equal(validateReportInput({ targetUserId: "user-2", reason: "made_up" }).valid, false);
  assert.equal(validateReportInput({ targetUserId: "", reason: "spam" }).valid, false);
  assert.equal(validateReportInput({ targetUserId: "user-2", reason: "other", description: "x".repeat(1001) }).valid, false);
});
