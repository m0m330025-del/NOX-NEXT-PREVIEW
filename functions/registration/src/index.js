import { createHash, randomBytes } from "node:crypto";
import { Client, ID, TablesDB, Users, Query } from "node-appwrite";
import { normalizeRegistrationInput, hasApprovedRegistrationProfile } from "./policy.js";

const DATABASE_ID = process.env.NOX_DATABASE_ID || "6afc583f00382386b997";
const EMAIL_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_WINDOW_LIMIT = 3;

const json = (res, status, body) => res.json(body, status);

function createNoxId() {
  return "NX" + randomBytes(7).toString("hex").toUpperCase();
}

export default async ({ req, res, log }) => {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
  const input = normalizeRegistrationInput(req.bodyJson);
  if (!input) return json(res, 400, { error: "invalid_registration_data" });

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.NOX_REGISTRATION_API_KEY;
  if (!endpoint || !projectId || !apiKey) {
    log("Registration function is missing server configuration.");
    return json(res, 503, { error: "service_unavailable" });
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const users = new Users(client);
  const db = new TablesDB(client);
  const emailHash = createHash("sha256").update(input.email).digest("hex");
  const now = new Date();
  const windowStart = new Date(now.getTime() - EMAIL_WINDOW_MS).toISOString();

  try {
    const recent = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: "registration_attempts",
      queries: [
        Query.equal("emailHash", emailHash),
        Query.greaterThan("attemptedAt", windowStart),
        Query.limit(EMAIL_WINDOW_LIMIT)
      ]
    });
    if (recent.rows.length >= EMAIL_WINDOW_LIMIT) {
      return json(res, 429, { error: "registration_temporarily_limited" });
    }
    await db.createRow({
      databaseId: DATABASE_ID,
      tableId: "registration_attempts",
      rowId: ID.unique(),
      data: { emailHash, attemptedAt: now.toISOString() },
      permissions: []
    });
  } catch {
    log("Registration abuse-control storage is unavailable.");
    return json(res, 503, { error: "service_unavailable" });
  }

  let createdUserId = null;
  try {
    const user = await users.create({
      userId: ID.unique(),
      email: input.email,
      password: input.password,
      name: input.displayName
    });
    createdUserId = user.$id;

    let profile = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        profile = await db.createRow({
          databaseId: DATABASE_ID,
          tableId: "users",
          rowId: createdUserId,
          data: {
            authUserId: createdUserId,
            noxId: createNoxId(),
            displayName: input.displayName,
            accountStatus: "APPROVED",
            role: "member",
            createdAt: new Date().toISOString()
          },
          permissions: []
        });
        break;
      } catch (error) {
        const conflict = error?.code === 409 || error?.type === "row_already_exists" || error?.type === "document_already_exists";
        if (!conflict || attempt === 4) throw error;
      }
    }
    if (!hasApprovedRegistrationProfile(profile)) throw new Error("profile_creation_failed");

    return json(res, 201, { userId: createdUserId, accountStatus: "APPROVED" });
  } catch (error) {
    if (createdUserId) {
      try {
        await users.delete({ userId: createdUserId });
      } catch {
        log("Registration rollback could not remove a partially created auth account.");
      }
    }
    const duplicate = error?.code === 409 || error?.type === "user_already_exists";
    if (duplicate) return json(res, 409, { error: "email_already_registered" });
    log("Registration could not complete; credentials and personal input were not logged.");
    return json(res, 503, { error: "registration_failed" });
  }
};
