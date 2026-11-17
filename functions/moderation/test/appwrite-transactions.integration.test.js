import test from "node:test";
import assert from "node:assert/strict";
import { Client, ID, TablesDB } from "node-appwrite";

const enabled = Boolean(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_API_KEY &&
  process.env.APPWRITE_DATABASE_ID
);

test("Appwrite commits and rolls back staged friend-request updates", { skip: !enabled }, async () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const db = new TablesDB(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const tableId = "friend_requests";
  const rowId = ID.unique();
  const now = new Date().toISOString();
  const senderId = ID.unique();
  const recipientId = ID.unique();

  await db.createRow({
    databaseId,
    tableId,
    rowId,
    data: { senderId, recipientId, status: "pending", createdAt: now, updatedAt: now },
    permissions: []
  });

  let transactionId;
  try {
    const tx = await db.createTransaction({});
    transactionId = tx.$id;
    await db.updateRow({
      databaseId, tableId, rowId,
      data: { status: "accepted", updatedAt: new Date().toISOString() },
      transactionId
    });

    // Before commit, ordinary reads must still see the committed value.
    const beforeCommit = await db.getRow({ databaseId, tableId, rowId });
    assert.equal(beforeCommit.status, "pending");

    await db.updateTransaction({ transactionId, commit: true });
    transactionId = undefined;
    const afterCommit = await db.getRow({ databaseId, tableId, rowId });
    assert.equal(afterCommit.status, "accepted");

    const rollbackTx = await db.createTransaction({});
    transactionId = rollbackTx.$id;
    await db.updateRow({
      databaseId, tableId, rowId,
      data: { status: "declined", updatedAt: new Date().toISOString() },
      transactionId
    });
    await db.updateTransaction({ transactionId, rollback: true });
    transactionId = undefined;

    const afterRollback = await db.getRow({ databaseId, tableId, rowId });
    assert.equal(afterRollback.status, "accepted");
  } finally {
    if (transactionId) {
      try { await db.updateTransaction({ transactionId, rollback: true }); } catch {}
    }
    await db.deleteRow({ databaseId, tableId, rowId });
  }
});
