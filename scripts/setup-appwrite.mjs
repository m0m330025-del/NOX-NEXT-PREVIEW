/**
 * Idempotent NOX_CORE bootstrap for Appwrite TablesDB.
 * Uses the existing serverless database; never creates or deletes the database.
 * Tables remain private and row-level security is enabled.
 */
import { Client, TablesDB } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID || "6af9ca51000735dfb692";
const databaseId = process.env.APPWRITE_DATABASE_ID || "6afc583f00382386b997";
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("Missing APPWRITE_API_KEY. Use a protected environment secret.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new TablesDB(client);
const database = await db.get({ databaseId });
if (database.$id !== databaseId || database.name !== "NOX_CORE") {
  throw new Error("Configured database ID does not match NOX_CORE.");
}
console.log("Verified existing database:", database.$id, database.name);

const definitions = [
  {
    id: "users", name: "Users",
    columns: [
      { key: "authUserId", type: "varchar", size: 36, required: true },
      { key: "noxId", type: "varchar", size: 32, required: true },
      { key: "displayName", type: "varchar", size: 80, required: true },
      { key: "avatarFileId", type: "varchar", size: 36, required: false },
      { key: "createdAt", type: "datetime", required: true }
    ],
    indexes: [
      { key: "authUserId_unique", type: "unique", columns: ["authUserId"] },
      { key: "noxId_unique", type: "unique", columns: ["noxId"] }
    ]
  },
  {
    id: "friend_requests", name: "Friend Requests",
    columns: [
      { key: "senderId", type: "varchar", size: 36, required: true },
      { key: "recipientId", type: "varchar", size: 36, required: true },
      { key: "status", type: "varchar", size: 16, required: true },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true }
    ],
    indexes: [
      { key: "recipient_status", type: "key", columns: ["recipientId", "status"] },
      { key: "sender_status", type: "key", columns: ["senderId", "status"] }
    ]
  },
  {
    id: "friendships", name: "Friendships",
    columns: [
      { key: "userAId", type: "varchar", size: 36, required: true },
      { key: "userBId", type: "varchar", size: 36, required: true },
      { key: "createdAt", type: "datetime", required: true }
    ],
    indexes: [
      { key: "userA_userB_unique", type: "unique", columns: ["userAId", "userBId"] },
      { key: "userB_lookup", type: "key", columns: ["userBId"] }
    ]
  },
  {
    id: "notifications", name: "Notifications",
    columns: [
      { key: "recipientId", type: "varchar", size: 36, required: true },
      { key: "type", type: "varchar", size: 40, required: true },
      { key: "referenceId", type: "varchar", size: 36, required: false },
      { key: "isRead", type: "boolean", required: true },
      { key: "createdAt", type: "datetime", required: true }
    ],
    indexes: [
      { key: "recipient_created", type: "key", columns: ["recipientId", "createdAt"] }
    ]
  }
];

const current = await db.listTables({ databaseId, total: true });
const currentIds = new Set(current.tables.map((item) => item.$id));

for (const table of definitions) {
  if (!currentIds.has(table.id)) {
    const created = await db.createTable({
      databaseId,
      tableId: table.id,
      name: table.name,
      permissions: [],
      rowSecurity: true
    });
    console.log("Created private table:", created.$id);
    currentIds.add(table.id);
  }

  // Always inspect the persisted table configuration, including on retries.
  const verifiedTable = await db.getTable({ databaseId, tableId: table.id });
  if (verifiedTable.rowSecurity !== true) {
    throw new Error("Row-level security is not enabled for table: " + table.id);
  }
  if (!Array.isArray(verifiedTable.permissions) || verifiedTable.permissions.length !== 0) {
    throw new Error("Table permissions must remain empty for private table: " + table.id);
  }
  console.log("Verified private table and row security:", verifiedTable.$id);

  // Reconcile columns even when a table already exists. This makes retries safe
  // after a partial run (for example, if index creation previously failed).
  const existingColumns = await db.listColumns({
    databaseId,
    tableId: table.id,
    total: true
  });
  const columnKeys = new Set(existingColumns.columns.map((item) => item.key));

  for (const column of table.columns) {
    if (columnKeys.has(column.key)) {
      console.log("Already exists column:", table.id + "." + column.key);
      continue;
    }
    const method = {
      varchar: "createVarcharColumn",
      datetime: "createDatetimeColumn",
      boolean: "createBooleanColumn"
    }[column.type];
    if (!method || typeof db[method] !== "function") {
      throw new Error("Unsupported TablesDB column type or SDK method: " + column.type);
    }
    const args = {
      databaseId,
      tableId: table.id,
      key: column.key,
      required: column.required
    };
    if (column.type === "varchar") args.size = column.size;
    await db[method](args);
    console.log("Created column:", table.id + "." + column.key);
  }

  // Appwrite TablesDB createIndex expects "columns", not the legacy
  // "attributes" property.
  const existingIndexes = await db.listIndexes({
    databaseId,
    tableId: table.id,
    total: true
  });
  const indexKeys = new Set(existingIndexes.indexes.map((item) => item.$id ?? item.key));

  for (const index of table.indexes) {
    if (indexKeys.has(index.key)) {
      console.log("Already exists index:", table.id + "." + index.key);
      continue;
    }
    // TablesDB may briefly report a newly-created column as unavailable.
    // Retry only that transient condition; fail immediately for other errors.
    let completed = false;
    let createdNow = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        await db.createIndex({
          databaseId,
          tableId: table.id,
          key: index.key,
          type: index.type,
          columns: index.columns
        });
        completed = true;
        createdNow = true;
        break;
      } catch (error) {
        // A conflict means the index already exists; do not report it as newly created.
        if (error?.type === "column_index_already_exists" || error?.code === 409) {
          console.log("Verified existing index after conflict:", table.id + "." + index.key);
          completed = true;
          break;
        }
        const transient = error?.type === "column_not_available";
        if (!transient || attempt === 5) throw error;
        const delayMs = 1000 * (attempt + 1);
        console.log("Column not ready for index " + table.id + "." + index.key +
          "; retrying in " + delayMs + "ms");
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    if (!completed) throw new Error("Could not create index: " + table.id + "." + index.key);
    if (createdNow) console.log("Created index:", table.id + "." + index.key);
  }
}

const finalList = await db.listTables({ databaseId, total: true });
const finalIds = new Set(finalList.tables.map((item) => item.$id));
for (const table of definitions) {
  if (!finalIds.has(table.id)) throw new Error("Missing expected table: " + table.id);
}
console.log("NOX_CORE TablesDB bootstrap complete:", definitions.map((item) => item.id).join(", "));
console.log("All tables have empty table permissions and rowSecurity enabled.");
console.log("No public access or friend APIs were enabled.");
