import test from "node:test";
import assert from "node:assert/strict";
import { TablesDB } from "node-appwrite";

test("pinned Appwrite SDK exposes the TablesDB transaction methods used by NOX", () => {
  assert.equal(typeof TablesDB.prototype.createTransaction, "function");
  assert.equal(typeof TablesDB.prototype.updateTransaction, "function");
  assert.equal(typeof TablesDB.prototype.getRow, "function");
  assert.equal(typeof TablesDB.prototype.updateRow, "function");
  assert.equal(typeof TablesDB.prototype.createRow, "function");
});
