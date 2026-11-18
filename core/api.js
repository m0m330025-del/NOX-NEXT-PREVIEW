/**
 * NOX authenticated API adapter for Appwrite Functions.
 * Pass a short-lived Appwrite user JWT obtained from the authenticated SDK session.
 * Do not store JWTs in localStorage or embed server API keys in browser code.
 */
const FUNCTION_ENDPOINT = "https://nox-next-preview.fra.appwrite.run";

export async function noxApi(path, { jwt, method = "GET", body, query } = {}) {
  if (typeof jwt !== "string" || !jwt.trim()) throw new Error("authentication_required");
  if (!path.startsWith("/") || path.includes("..")) throw new Error("invalid_route");

  const url = new URL(FUNCTION_ENDPOINT + path);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      "x-appwrite-user-jwt": jwt,
      ...(body !== undefined ? { "content-type": "application/json" } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  let payload;
  try { payload = await response.json(); }
  catch { payload = { error: "invalid_server_response" }; }

  if (!response.ok) {
    const error = new Error(payload?.error || "request_failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const noxApiRoutes = Object.freeze({
  lookupFriend: (jwt, noxId) => noxApi("/friends/lookup", { jwt, query: { noxId } }),
  sendFriendRequest: (jwt, noxId) => noxApi("/friends/requests", { jwt, method: "POST", body: { noxId } }),
  friendRequests: (jwt, direction = "incoming") => noxApi("/friends/requests", { jwt, query: { direction } }),
  respondFriendRequest: (jwt, requestId, decision) => noxApi("/friends/requests/respond", { jwt, method: "POST", body: { requestId, decision } }),
  cancelFriendRequest: (jwt, requestId) => noxApi("/friends/requests/cancel", { jwt, method: "POST", body: { requestId } }),
  friends: jwt => noxApi("/friends", { jwt }),
  conversations: jwt => noxApi("/conversations", { jwt }),
  createConversation: (jwt, friendUserId) => noxApi("/conversations", { jwt, method: "POST", body: { friendUserId } }),
  messages: (jwt, conversationId) => noxApi("/messages", { jwt, query: { conversationId } }),
  sendMessage: (jwt, conversationId, body, idempotencyKey) => noxApi("/messages", { jwt, method: "POST", body: { conversationId, body, idempotencyKey } }),
  notifications: jwt => noxApi("/notifications", { jwt }),
  markNotificationRead: (jwt, notificationId) => noxApi("/notifications/read", { jwt, method: "POST", body: { notificationId } }),
  blocks: jwt => noxApi("/blocks", { jwt }),
  block: (jwt, targetUserId) => noxApi("/blocks", { jwt, method: "POST", body: { targetUserId } }),
  unblock: (jwt, targetUserId) => noxApi("/blocks", { jwt, method: "DELETE", body: { targetUserId } }),
  reportAccount: (jwt, report) => noxApi("/reports", { jwt, method: "POST", body: report })
});
