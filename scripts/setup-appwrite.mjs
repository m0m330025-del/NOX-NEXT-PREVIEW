/**
 * One-time NOX_CORE bootstrap for Appwrite.
 *
 * Run with:
 *   APPWRITE_API_KEY="..." node scripts/setup-appwrite.mjs
 *
 * The API key must be created in the Appwrite Console with database/schema
 * permissions and supplied only through the local environment. Never commit it.
 */
import { Client, Databases, IndexType } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID || "6af9ca51000735dfb692";
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("Missing APPWRITE_API_KEY. Set it in your local environment; do not paste it into the source code.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);
const databaseId = "nox_core";

async function ensure(label, fn) {
  try {
    await fn();
    console.log("Created:", label);
  } catch (error) {
    if (error?.code === 409) {
      console.log("Already exists:", label);
      return;
    }
    throw error;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntilAvailable(label, getResource, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const resource = await getResource();

    if (resource.status === "available") {
      console.log("Ready:", label);
      return;
    }

    if (resource.status === "failed") {
      throw new Error(`${label} entered failed status.`);
    }

    await sleep(2_000);
  }

  throw new Error(`Timed out waiting for ${label} to become available.`);
}

await ensure("database NOX_CORE", () =>
  db.create({ databaseId, name: "NOX_CORE", enabled: true })
);

const schemas = [
  {
    id: "users",
    name: "Users",
    strings: [
      ["authUserId", 64, true],
      ["noxId", 32, true],
      ["displayName", 80, true],
      ["avatarFileId", 64, false],
    ],
    datetimes: [["createdAt", true]],
    indexes: [["authUserId_unique", ["authUserId"], IndexType.Unique], ["noxId_unique", ["noxId"], IndexType.Unique]],
  },
  {
    id: "friend_requests",
    name: "Friend Requests",
    strings: [
      ["senderId", 64, true],
      ["recipientId", 64, true],
      ["status", 20, true],
    ],
    datetimes: [["createdAt", true], ["updatedAt", true]],
    indexes: [["recipient_status", ["recipientId", "status"], IndexType.Key], ["sender_status", ["senderId", "status"], IndexType.Key]],
  },
  {
    id: "friendships",
    name: "Friendships",
    strings: [
      ["userAId", 64, true],
      ["userBId", 64, true],
    ],
    datetimes: [["createdAt", true]],
    indexes: [["userA_userB_unique", ["userAId", "userBId"], IndexType.Unique], ["userB_lookup", ["userBId"], IndexType.Key]],
  },
  {
    id: "notifications",
    name: "Notifications",
    strings: [
      ["recipientId", 64, true],
      ["type", 40, true],
      ["referenceId", 64, false],
    ],
    booleans: [["isRead", true]],
    datetimes: [["createdAt", true]],
    indexes: [["recipient_created", ["recipientId", "createdAt"], IndexType.Key]],
  },
];

for (const schema of schemas) {
  await ensure(`collection ${schema.id}`, () =>
    db.createCollection({
      databaseId,
      collectionId: schema.id,
      name: schema.name,
      permissions: [],
      documentSecurity: true,
      enabled: true,
    })
  );

  for (const [key, size, required] of schema.strings || []) {
    await ensure(`${schema.id}.${key}`, () =>
      db.createStringAttribute({ databaseId, collectionId: schema.id, key, size, required })
    );
    await waitUntilAvailable(`${schema.id}.${key}`, () =>
      db.getAttribute({ databaseId, collectionId: schema.id, key })
    );
  }
  for (const [key, required] of schema.datetimes || []) {
    await ensure(`${schema.id}.${key}`, () =>
      db.createDatetimeAttribute({ databaseId, collectionId: schema.id, key, required })
    );
    await waitUntilAvailable(`${schema.id}.${key}`, () =>
      db.getAttribute({ databaseId, collectionId: schema.id, key })
    );
  }
  for (const [key, required] of schema.booleans || []) {
    await ensure(`${schema.id}.${key}`, () =>
      db.createBooleanAttribute({ databaseId, collectionId: schema.id, key, required })
    );
    await waitUntilAvailable(`${schema.id}.${key}`, () =>
      db.getAttribute({ databaseId, collectionId: schema.id, key })
    );
  }
  for (const [key, attributes, type] of schema.indexes || []) {
    await ensure(`${schema.id} index ${key}`, () =>
      db.createIndex({
        databaseId,
        collectionId: schema.id,
        key,
        type,
        attributes,
      })
    );
    await waitUntilAvailable(`${schema.id} index ${key}`, () =>
      db.getIndex({ databaseId, collectionId: schema.id, key })
    );
  }
}

console.log("NOX_CORE bootstrap finished. Collection permissions are private by default.");
console.log("Next: implement authenticated server functions for friend requests; do not allow direct client writes.");
