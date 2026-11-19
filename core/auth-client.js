import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_REGISTRATION_FUNCTION_ID,
  APPWRITE_MODERATION_FUNCTION_ID
} from "./appwrite-config.js";

if (!window.Appwrite?.Client || !window.Appwrite?.Account || !window.Appwrite?.Functions) {
  throw new Error("Appwrite Web SDK failed to load.");
}

const client = new window.Appwrite.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new window.Appwrite.Account(client);
const functions = new window.Appwrite.Functions(client);

function parseExecution(execution) {
  const status = Number(execution?.responseStatusCode ?? execution?.statusCode ?? 200);
  let payload = {};
  try {
    payload = execution?.responseBody ? JSON.parse(execution.responseBody) : {};
  } catch {
    throw new Error("invalid_function_response");
  }
  if (status < 200 || status >= 300) {
    const error = new Error(payload.error || "function_request_failed");
    error.code = payload.error || "function_request_failed";
    error.status = status;
    throw error;
  }
  return payload;
}

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

export async function registerAccount({ email, password, displayName }) {
  if (!email || !password || !displayName) throw new Error("Missing registration details");
  const execution = await functions.createExecution({
    functionId: APPWRITE_REGISTRATION_FUNCTION_ID,
    body: JSON.stringify({ email, password, displayName }),
    async: false,
    method: "POST",
    xpath: "/"
  });
  const result = parseExecution(execution);
  if (!result.userId || result.accountStatus !== "APPROVED") {
    throw new Error("registration_not_approved");
  }
  return result;
}

export async function getMembership() {
  const execution = await functions.createExecution({
    functionId: APPWRITE_MODERATION_FUNCTION_ID,
    body: "",
    async: false,
    method: "GET",
    xpath: "/membership"
  });
  return parseExecution(execution);
}

export async function closeCurrentSession() {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const alreadyClosed = /already closed|session.*not found|unauthorized/.test(message);
    if (![401, 404].includes(Number(error?.code)) && !alreadyClosed) throw error;
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
