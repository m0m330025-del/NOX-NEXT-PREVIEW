import test from "node:test";
import assert from "node:assert/strict";

const calls = [];
let accountBehavior = {};

class MockClient {
  setEndpoint(value) { calls.push(["endpoint", value]); return this; }
  setProject(value) { calls.push(["project", value]); return this; }
}
class MockAccount {
  constructor(client) { this.client = client; }
  async createEmailPasswordSession(args) {
    calls.push(["createEmailPasswordSession", args]);
    if (accountBehavior.createSessionError) throw accountBehavior.createSessionError;
    return { $id: "session_test" };
  }
  async get() {
    calls.push(["get"]);
    if (accountBehavior.getError) throw accountBehavior.getError;
    return { $id: "synthetic_user" };
  }
  async deleteSession(args) {
    calls.push(["deleteSession", args]);
    if (accountBehavior.deleteError) throw accountBehavior.deleteError;
    return {};
  }
  async createRecovery(args) {
    calls.push(["createRecovery", args]);
    if (accountBehavior.recoveryError) throw accountBehavior.recoveryError;
    return {};
  }
  async updateRecovery(args) {
    calls.push(["updateRecovery", args]);
    if (accountBehavior.updateRecoveryError) throw accountBehavior.updateRecoveryError;
    return {};
  }
}

globalThis.window = { Appwrite: { Client: MockClient, Account: MockAccount } };
const auth = await import("../core/auth-client.js");

test("configures the public Appwrite browser client without embedding credentials", () => {
  assert.ok(calls.some(([name, value]) => name === "endpoint" && value === "https://fra.cloud.appwrite.io/v1"));
  assert.ok(calls.some(([name, value]) => name === "project" && value === "6af9ca51000735dfb692"));
});

test("creates an email/password session and returns the authenticated account", async () => {
  calls.length = 0;
  accountBehavior = {};
  const user = await auth.createLoginSession("member@example.test", "synthetic-password");
  assert.equal(user.$id, "synthetic_user");
  assert.ok(calls.some(([name]) => name === "createEmailPasswordSession"));
  assert.ok(calls.some(([name]) => name === "get"));
});

test("rejects empty login credentials before contacting Appwrite", async () => {
  calls.length = 0;
  await assert.rejects(() => auth.createLoginSession("", "password"), /Missing credentials/);
  assert.equal(calls.length, 0);
});

test("cleans up the newly created session if account retrieval fails", async () => {
  calls.length = 0;
  accountBehavior = { getError: new Error("synthetic account lookup failure") };
  await assert.rejects(() => auth.createLoginSession("member@example.test", "synthetic-password"));
  assert.ok(calls.some(([name, args]) => name === "deleteSession" && args.sessionId === "current"));
  accountBehavior = {};
});

test("closes the current session and safely tolerates an already-closed session", async () => {
  calls.length = 0;
  await auth.closeCurrentSession();
  assert.ok(calls.some(([name, args]) => name === "deleteSession" && args.sessionId === "current"));
  accountBehavior = { deleteError: new Error("already closed") };
  await assert.doesNotReject(() => auth.closeCurrentSession());
  accountBehavior = {};
});

test("starts password recovery with the supplied redirect URL", async () => {
  calls.length = 0;
  await auth.requestPasswordRecovery("member@example.test", "https://nox.example/recovery.html");
  assert.ok(calls.some(([name, args]) => name === "createRecovery" &&
    args.email === "member@example.test" && args.url === "https://nox.example/recovery.html"));
});

test("rejects incomplete password recovery input", async () => {
  await assert.rejects(() => auth.requestPasswordRecovery("", "https://nox.example/recovery.html"), /Missing recovery details/);
  await assert.rejects(() => auth.requestPasswordRecovery("member@example.test", ""), /Missing recovery details/);
});

test("completes password recovery using Appwrite's userId and secret", async () => {
  calls.length = 0;
  await auth.completePasswordRecovery("synthetic_user", "synthetic_secret", "new-synthetic-password");
  assert.ok(calls.some(([name, args]) => name === "updateRecovery" &&
    args.userId === "synthetic_user" && args.secret === "synthetic_secret" &&
    args.password === "new-synthetic-password"));
});

test("rejects weak or incomplete password recovery input", async () => {
  await assert.rejects(() => auth.completePasswordRecovery("", "secret", "long-enough-password"), /Invalid recovery details/);
  await assert.rejects(() => auth.completePasswordRecovery("user", "", "long-enough-password"), /Invalid recovery details/);
  await assert.rejects(() => auth.completePasswordRecovery("user", "secret", "short"), /Invalid recovery details/);
});
