import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./appwrite-config.js";

if (!window.Appwrite?.Client || !window.Appwrite?.Account) {
  throw new Error("Appwrite Web SDK failed to load.");
}

const client = new window.Appwrite.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new window.Appwrite.Account(client);

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (_) {
    return null;
  }
}

export async function createLoginSession(email, password) {
  if (!email || !password) throw new Error("Missing credentials");
  await account.createEmailPasswordSession({ email, password });
  try {
    return await account.get();
  } catch (error) {
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch (_) {}
    throw error;
  }
}

export async function closeCurrentSession() {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch (error) {
    // A missing or expired session is already closed; network/server failures must surface.
    if (![401, 404].includes(Number(error?.code))) throw error;
  }
}

export async function requestPasswordRecovery(email, url) {
  if (!email || !url) throw new Error("Missing recovery details");
  return account.createRecovery({ email, url });
}

export async function completePasswordRecovery(userId, secret, password) {
  if (!userId || !secret || !password || password.length < 8) {
    throw new Error("Invalid recovery details");
  }
  return account.updateRecovery({ userId, secret, password });
}
