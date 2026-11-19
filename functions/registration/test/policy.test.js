import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRegistrationInput, hasApprovedRegistrationProfile } from "../src/policy.js";

test("normalizes registration email and display name", () => {
  assert.deepEqual(normalizeRegistrationInput({
    email: "  MEMBER@Example.Test ",
    displayName: "  NOX Member ",
    password: "strong-pass-123"
  }), {
    email: "member@example.test",
    displayName: "NOX Member",
    password: "strong-pass-123"
  });
});

test("rejects invalid registration input", () => {
  assert.equal(normalizeRegistrationInput(null), null);
  assert.equal(normalizeRegistrationInput([]), null);
  assert.equal(normalizeRegistrationInput({ email: "bad", displayName: "Name", password: "strong-pass-123" }), null);
  assert.equal(normalizeRegistrationInput({ email: "a@b.test", displayName: "", password: "strong-pass-123" }), null);
  assert.equal(normalizeRegistrationInput({ email: "a@b.test", displayName: "Name", password: "short" }), null);
  assert.equal(normalizeRegistrationInput({ email: "a@b.test", displayName: "x".repeat(81), password: "strong-pass-123" }), null);
});

test("only complete server profiles explicitly marked APPROVED qualify", () => {
  assert.equal(hasApprovedRegistrationProfile({
    authUserId: "auth_1", noxId: "NX1234567890ABCD",
    displayName: "Member", accountStatus: "APPROVED"
  }), true);
  assert.equal(hasApprovedRegistrationProfile({
    authUserId: "auth_1", noxId: "NX1234567890ABCD",
    displayName: "Member"
  }), false);
  assert.equal(hasApprovedRegistrationProfile({
    authUserId: "auth_1", noxId: "NX1234567890ABCD",
    displayName: "Member", accountStatus: "PENDING"
  }), false);
});
