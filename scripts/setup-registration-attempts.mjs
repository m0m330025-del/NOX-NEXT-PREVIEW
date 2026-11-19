/**
 * Narrow Appwrite bootstrap: creates/verifies ONLY registration_attempts.
 *
 * Required environment:
 *   APPWRITE_API_KEY (server-side secret; never commit it)
 *
 * Optional environment:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_DATABASE_ID
 *
 * This script does not run the general NOX_CORE bootstrap and does not touch
 * users, moderation, messaging, or any other table.
 */
import { Client, TablesDB } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID || "6af9ca51000735dfb692";
const databaseId = process.env.APPWRITE_DATABASE_ID || "6afc583f00382386b997";
const apiKey = process.env.APPWRITE_API_KEY;

const tableId = "registration_attempts";
const tableName = "Registration Attempts";
const expectedColumns = [
  { key: "emailHash", type: "varchar", size: 64, required: true },
  { key: "attemptedAt", type: "datetime", required: true }
];
const expectedIndex = {
  key: "email_hash_attempted",
  type: "key",
  columns: ["emailHash", "attemptedAt"]
};

if (!apiKey) {
  throw new Error("Missing APPWRITE_API_KEY. Supply it through a protected environment secret.");
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new TablesDB(client);

const database = await db.get({ databaseId });
if (database.$id !== databaseId || database.name !== "NOX_CORE") {
  throw new Error("Configured database ID does not match the expected NOX_CORE database.");
}
console.log("Verified target database:", database.$id, database.name);

let tables = await db.listTables({ databaseId, total: true });
let table = tables.tables.find((item) => item.$id === tableId);

if (!table) {
  table = await db.createTable({
    databaseId,
    tableId,
    name: tableName,
    permissions: [],
    rowSecurity: true
  });
  console.log("Created table:", table.$id);
} else {
  console.log("Table already exists; checking it without replacing it:", table.$id);
}

table = await db.getTable({ databaseId, tableId });
if (table.rowSecurity !== true) {
  throw new Error("Safety stop: registration_attempts exists but rowSecurity is not enabled. No permissions were changed.");
}
if (!Array.isArray(table.$permissions) || table.$permissions.length !== 0) {
  throw new Error("Safety stop: registration_attempts exists but table permissions are not empty. No permissions were changed.");
}
console.log("Verified private table with row security enabled.");

let columnResult = await db.listColumns({ databaseId, tableId, total: true });
for (const expected of expectedColumns) {
  let actual = columnResult.columns.find((column) => column.key === expected.key);
  if (!actual) {
    const method = expected.type === "varchar" ? "createVarcharColumn" : "createDatetimeColumn";
    const args = {
      databaseId,
      tableId,
      key: expected.key,
      required: expected.required
    };
    if (expected.type === "varchar") args.size = expected.size;
    await db[method](args);
    console.log("Created column:", expected.key);
    columnResult = await db.listColumns({ databaseId, tableId, total: true });
    actual = columnResult.columns.find((column) => column.key === expected.key);
  }

  if (
    !actual ||
    actual.type !== expected.type ||
    actual.required !== expected.required ||
    (expected.type === "varchar" && actual.size !== expected.size)
  ) {
    throw new Error("Safety stop: existing column does not match expected schema: " + expected.key);
  }
  console.log("Verified column:", expected.key);
}

let indexResult = await db.listIndexes({ databaseId, tableId, total: true });
let index = indexResult.indexes.find((item) => (item.$id ?? item.key) === expectedIndex.key);

if (!index) {
  await db.createIndex({
    databaseId,
    tableId,
    key: expectedIndex.key,
    type: expectedIndex.type,
    columns: expectedIndex.columns
  });
  console.log("Created index:", expectedIndex.key);
  // Appwrite may take a short time to expose a newly-created index.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    indexResult = await db.listIndexes({ databaseId, tableId, total: true });
    index = indexResult.indexes.find((item) => (item.$id ?? item.key) === expectedIndex.key);
    if (index) break;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}

if (
  !index ||
  index.type !== expectedIndex.type ||
  JSON.stringify(index.columns) !== JSON.stringify(expectedIndex.columns)
) {
  throw new Error("Safety stop: required index is missing or does not match the expected definition.");
}

table = await db.getTable({ databaseId, tableId });
if (table.rowSecurity !== true || !Array.isArray(table.$permissions) || table.$permissions.length !== 0) {
  throw new Error("Final verification failed: table is not private with row security enabled.");
}

console.log("SUCCESS: registration_attempts is ready and verified.");
console.log("Verified columns: emailHash (varchar 64, required), attemptedAt (datetime, required).");
console.log("Verified index: email_hash_attempted (key: emailHash, attemptedAt).");
console.log("No other table or Appwrite resource was accessed for modification.");
