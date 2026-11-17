/**
 * One-time NOX_CORE bootstrap for Appwrite DocumentsDB.
 *
 * Uses the current schemaless DocumentsDB API. Collections do not have
 * predefined attributes; document fields are validated by trusted functions.
 * Never expose APPWRITE_API_KEY to the browser or commit it.
 */
import { Client, DocumentsDB, DocumentsDBIndexType } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID || "6af9ca51000735dfb692";
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("Missing APPWRITE_API_KEY. Supply it only as a protected environment secret.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new DocumentsDB(client);
const databaseId = "nox_core";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensure(label, create, get) {
  try {
    await create();
    console.log("Created:", label);
  } catch (error) {
    if (error?.code !== 409) throw error;
    await get(); // A 409 is accepted only if the expected resource can be fetched.
    console.log("Already exists and verified:", label);
  }
}

async function waitForIndex(label, getIndex, timeoutMs = 120_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const index = await getIndex();
    if (index.status === "available") {
      console.log("Ready:", label);
      return;
    }
    if (index.status === "failed") {
      throw new Error(`${label} entered failed status.`);
    }
    await sleep(2_000);
  }
  throw new Error(`Timed out waiting for ${label} to become available.`);
}

await ensure(
  `database ${databaseId}`,
  () => db.create({ databaseId, name: "NOX_CORE", enabled: true }),
  () => db.get({ databaseId })
);

const collections = [
  { id: "users", name: "Users" },
  { id: "friend_requests", name: "Friend Requests" },
  { id: "friendships", name: "Friendships" },
  { id: "notifications", name: "Notifications" },
];

for (const collection of collections) {
  await ensure(
    `collection ${collection.id}`,
    () => db.createCollection({
      databaseId,
      collectionId: collection.id,
      name: collection.name,
      permissions: [],
      documentSecurity: true,
    }),
    () => db.getCollection({ databaseId, collectionId: collection.id })
  );
}

const indexes = [
  { collectionId: "users", key: "authUserId_unique", type: DocumentsDBIndexType.Unique, attributes: ["authUserId"] },
  { collectionId: "users", key: "noxId_unique", type: DocumentsDBIndexType.Unique, attributes: ["noxId"] },
  { collectionId: "friend_requests", key: "recipient_status", type: DocumentsDBIndexType.Key, attributes: ["recipientId", "status"] },
  { collectionId: "friend_requests", key: "sender_status", type: DocumentsDBIndexType.Key, attributes: ["senderId", "status"] },
  { collectionId: "friendships", key: "userA_userB_unique", type: DocumentsDBIndexType.Unique, attributes: ["userAId", "userBId"] },
  { collectionId: "friendships", key: "userB_lookup", type: DocumentsDBIndexType.Key, attributes: ["userBId"] },
  { collectionId: "notifications", key: "recipient_created", type: DocumentsDBIndexType.Key, attributes: ["recipientId", "createdAt"] },
];

for (const index of indexes) {
  const label = `${index.collectionId} index ${index.key}`;
  await ensure(
    label,
    () => db.createIndex({
      databaseId,
      collectionId: index.collectionId,
      key: index.key,
      type: index.type,
      attributes: index.attributes,
    }),
    () => db.getIndex({
      databaseId,
      collectionId: index.collectionId,
      key: index.key,
    })
  );
  await waitForIndex(label, () => db.getIndex({
    databaseId,
    collectionId: index.collectionId,
    key: index.key,
  }));
}

console.log("NOX_CORE DocumentsDB bootstrap finished.");
console.log("Collections remain private; no client permissions or friend APIs were enabled.");
console.log("Next: implement and security-test authenticated Appwrite Functions before connecting the frontend.");
