import test from "node:test";
import assert from "node:assert/strict";
import {
  validateReportInput,
  validateBlockTarget
} from "../src/policy.js";

test("accepts an allow-listed account report", () => {
  const result = validateReportInput({
    targetUserId: "user_123",
    contentType: "account",
    reason: "spam",
    description: "Repeated unwanted messages"
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.reason, "spam");
});

test("rejects an unknown report reason", () => {
  const result = validateReportInput({
    targetUserId: "user_123",
    contentType: "account",
    reason: "unlisted"
  });
  assert.deepEqual(result, { ok: false, error: "invalid_reason" });
});

test("rejects descriptions longer than 1000 characters", () => {
  const result = validateReportInput({
    targetUserId: "user_123",
    contentType: "account",
    reason: "other",
    description: "x".repeat(1001)
  });
  assert.deepEqual(result, { ok: false, error: "invalid_description" });
});

test("requires a content ID for message reports", () => {
  const result = validateReportInput({
    targetUserId: "user_123",
    contentType: "message",
    reason: "harassment"
  });
  assert.deepEqual(result, { ok: false, error: "invalid_content_id" });
});

test("rejects self-blocking", () => {
  assert.deepEqual(
    validateBlockTarget("same_user", "same_user"),
    { ok: false, error: "cannot_block_self" }
  );
});

test("accepts a distinct valid block target", () => {
  assert.deepEqual(
    validateBlockTarget("other_user", "caller"),
    { ok: true, value: "other_user" }
  );
});

test("moderator allowlist grants only exact configured identities", async () => {
  const { isModerator } = await import("../src/policy.js");
  assert.equal(isModerator("mod_123", "mod_123, mod_456"), true);
  assert.equal(isModerator("user_123", "mod_123, mod_456"), false);
  assert.equal(isModerator("mod_123", ""), false);
  assert.equal(isModerator("mod_123", "mod_123-extra"), false);
});

test("malformed moderator configuration fails closed", async () => {
  const { isModerator } = await import("../src/policy.js");
  assert.equal(isModerator("mod_123", null), false);
  assert.equal(isModerator("mod_123", 123), false);
});
