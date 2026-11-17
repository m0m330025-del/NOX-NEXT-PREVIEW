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


test("block guard checks both directions", async () => {
  const { isBlockedEitherWay } = await import("../src/policy.js");
  const calls = [];
  const blocked = await isBlockedEitherWay("alice", "bob", async (a, b) => {
    calls.push([a, b]);
    return a === "bob" && b === "alice";
  });
  assert.equal(blocked, true);
  assert.deepEqual(calls, [["alice", "bob"], ["bob", "alice"]]);
});

test("block guard returns false when neither direction is blocked", async () => {
  const { isBlockedEitherWay } = await import("../src/policy.js");
  const blocked = await isBlockedEitherWay("alice", "bob", async () => false);
  assert.equal(blocked, false);
});

test("block guard rejects invalid or identical user pairs", async () => {
  const { isBlockedEitherWay } = await import("../src/policy.js");
  await assert.rejects(() => isBlockedEitherWay("same", "same", async () => false), /invalid_user_pair/);
  await assert.rejects(() => isBlockedEitherWay("", "bob", async () => false), /invalid_user_pair/);
});


test("normalizes valid NOX IDs", async () => {
  const { validateNoxId } = await import("../src/policy.js");
  assert.deepEqual(validateNoxId("  abC_1234 "), { ok: true, value: "ABC_1234" });
});

test("rejects malformed NOX IDs and request IDs", async () => {
  const { validateNoxId, validateRequestId } = await import("../src/policy.js");
  assert.equal(validateNoxId("ab").ok, false);
  assert.equal(validateNoxId("bad id!").ok, false);
  assert.equal(validateRequestId("../other").ok, false);
  assert.equal(validateRequestId("req_123").ok, true);
});


test("canonical friendship pair is stable regardless of input order", async () => {
  const { canonicalFriendPair } = await import("../src/policy.js");
  assert.deepEqual(canonicalFriendPair("user_b", "user_a"), {
    ok: true, userAId: "user_a", userBId: "user_b"
  });
  assert.deepEqual(canonicalFriendPair("same", "same"), {
    ok: false, error: "invalid_user_pair"
  });
});

test("only the recipient can respond to a pending request", async () => {
  const { canRespondToFriendRequest } = await import("../src/policy.js");
  const request = { senderId: "sender_1", recipientId: "recipient_1", status: "pending" };
  assert.equal(canRespondToFriendRequest(request, "recipient_1", "accept"), true);
  assert.equal(canRespondToFriendRequest(request, "recipient_1", "decline"), true);
  assert.equal(canRespondToFriendRequest(request, "sender_1", "accept"), false);
  assert.equal(canRespondToFriendRequest({ ...request, status: "accepted" }, "recipient_1", "accept"), false);
});

test("only the sender can cancel a pending request", async () => {
  const { canCancelFriendRequest } = await import("../src/policy.js");
  const request = { senderId: "sender_1", recipientId: "recipient_1", status: "pending" };
  assert.equal(canCancelFriendRequest(request, "sender_1"), true);
  assert.equal(canCancelFriendRequest(request, "recipient_1"), false);
  assert.equal(canCancelFriendRequest({ ...request, status: "declined" }, "sender_1"), false);
});


test("validates private message text and enforces the size limit", async () => {
  const { validateMessageBody } = await import("../src/policy.js");
  assert.deepEqual(validateMessageBody("  hello NOX  "), { ok: true, value: "hello NOX" });
  assert.equal(validateMessageBody("   ").ok, false);
  assert.equal(validateMessageBody("x".repeat(4001)).ok, false);
  assert.equal(validateMessageBody(null).ok, false);
});

test("conversation access requires the exact canonical participant pair", async () => {
  const { canAccessConversation, canReadOrSendMessage } = await import("../src/policy.js");
  const conversation = { participantAId: "alice_1", participantBId: "bob_22" };
  assert.equal(canAccessConversation(conversation, "bob_22", "alice_1"), true);
  assert.equal(canAccessConversation(conversation, "mallory_1", "alice_1"), false);
  assert.equal(canReadOrSendMessage(conversation, "alice_1"), true);
  assert.equal(canReadOrSendMessage(conversation, "mallory_1"), false);
});


test("message idempotency keys must be UUIDs", async () => {
  const { validateMessageId } = await import("../src/policy.js");
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  assert.deepEqual(validateMessageId(uuid), { ok: true, value: uuid });
  assert.equal(validateMessageId("not-a-uuid").ok, false);
  assert.equal(validateMessageId("../messages").ok, false);
});
