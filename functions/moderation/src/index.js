import { Client, Account } from "node-appwrite";
import { isModerator, validateBlockTarget, validateReportInput, validateNoxId, validateRequestId } from "./policy.js";
import { createModerationStore } from "./store.js";

const json = (res, status, body) => res.json(body, status);

function getRoute(path = "") {
  let normalized = path;
  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || "/";
}

export default async ({ req, res, log }) => {
  if (req.method === "OPTIONS") return res.text("", 204);
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    return json(res, 405, { error: "method_not_allowed" });
  }

  const jwt = req.headers?.["x-appwrite-user-jwt"];
  if (!jwt) return json(res, 401, { error: "authentication_required" });

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  if (!endpoint || !projectId) {
    log("Moderation function is missing required Appwrite runtime configuration.");
    return json(res, 503, { error: "service_unavailable" });
  }

  const userClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  let caller;
  try {
    caller = await new Account(userClient).get();
  } catch {
    return json(res, 401, { error: "authentication_failed" });
  }

  const route = getRoute(req.path);
  const body = req.bodyJson ?? {};



  if (route === "/friends/lookup" && req.method === "GET") {
    const checked = validateNoxId(req.query?.noxId);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const profile = await createModerationStore().lookupPublicProfile(checked.value);
      if (!profile) return json(res, 404, { error: "profile_unavailable" });
      return json(res, 200, { profile });
    } catch {
      log("Public profile lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/notifications" && req.method === "GET") {
    try {
      const notifications = await createModerationStore().listNotifications(caller.$id);
      return json(res, 200, { notifications });
    } catch {
      log("Notification lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/notifications/read" && req.method === "POST") {
    const checked = validateRequestId(body.notificationId);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const result = await createModerationStore().markNotificationRead(caller.$id, checked.value);
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 200, result);
    } catch {
      log("Notification update failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/friends/requests" && req.method === "POST") {
    const checked = validateNoxId(body.noxId);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const result = await createModerationStore().createFriendRequest(caller.$id, checked.value);
      if (result.error === "user_not_found") return json(res, 404, { error: result.error });
      if (result.error === "interaction_unavailable") return json(res, 403, { error: result.error });
      if (result.error === "cannot_request_self") return json(res, 400, { error: result.error });
      if (result.error) return json(res, 409, result);
      return json(res, 201, result);
    } catch {
      log("Friend request creation failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/friends/requests" && req.method === "GET") {
    const direction = req.query?.direction === "outgoing" ? "outgoing" : "incoming";
    try {
      const requests = await createModerationStore().listFriendRequests(caller.$id, direction);
      return json(res, 200, { requests });
    } catch {
      log("Friend request lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/friends/requests/respond" && req.method === "POST") {
    const checked = validateRequestId(body.requestId);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    if (!["accept", "decline"].includes(body.decision)) return json(res, 400, { error: "invalid_decision" });
    try {
      const result = await createModerationStore().respondToFriendRequest(caller.$id, checked.value, body.decision);
      if (result.error === "interaction_unavailable") return json(res, 403, { error: result.error });
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 200, result);
    } catch {
      log("Friend request response failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/friends/requests/cancel" && req.method === "POST") {
    const checked = validateRequestId(body.requestId);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const result = await createModerationStore().cancelFriendRequest(caller.$id, checked.value);
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 200, result);
    } catch {
      log("Friend request cancellation failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/friends" && req.method === "GET") {
    try {
      const friends = await createModerationStore().listFriendships(caller.$id);
      return json(res, 200, { friends });
    } catch {
      log("Friend list lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }


  if (route === "/conversations" && req.method === "GET") {
    try {
      const conversations = await createModerationStore().listConversations(caller.$id);
      return json(res, 200, { conversations });
    } catch {
      log("Conversation list lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/conversations" && req.method === "POST") {
    const checked = validateRequestId(body.friendUserId);
    if (!checked.ok) return json(res, 400, { error: "invalid_friend_id" });
    try {
      const result = await createModerationStore().createOrGetConversation(caller.$id, checked.value);
      if (result.error === "interaction_unavailable") return json(res, 403, { error: result.error });
      if (result.error === "friendship_required") return json(res, 403, { error: result.error });
      if (result.error) return json(res, 400, { error: result.error });
      return json(res, 200, result);
    } catch {
      log("Conversation creation failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/messages" && req.method === "GET") {
    const checked = validateRequestId(req.query?.conversationId);
    if (!checked.ok) return json(res, 400, { error: "invalid_conversation_id" });
    try {
      const result = await createModerationStore().listMessages(caller.$id, checked.value);
      if (result.error === "interaction_unavailable") return json(res, 403, { error: result.error });
      if (result.error === "friendship_required") return json(res, 403, { error: result.error });
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 200, result);
    } catch {
      log("Private message lookup failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/messages" && req.method === "POST") {
    const checked = validateRequestId(body.conversationId);
    if (!checked.ok) return json(res, 400, { error: "invalid_conversation_id" });
    if (typeof body.body !== "string" || !body.body.trim() || body.body.length > 4000) {
      return json(res, 400, { error: "invalid_message" });
    }
    try {
      const result = await createModerationStore().sendMessage(caller.$id, checked.value, body.body);
      if (result.error === "interaction_unavailable") return json(res, 403, { error: result.error });
      if (result.error === "friendship_required") return json(res, 403, { error: result.error });
      if (result.error === "message_rate_limited") return json(res, 429, { error: result.error });
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 201, result);
    } catch {
      log("Private message creation failed.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/reports" && req.method === "POST") {
    const checked = validateReportInput(body);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    if (checked.value.contentType !== "account") {
      return json(res, 400, { error: "content_reports_not_enabled" });
    }
    if (checked.value.targetUserId === caller.$id) {
      return json(res, 400, { error: "cannot_report_self" });
    }
    try {
      const result = await createModerationStore().createReport(caller.$id, checked.value);
      if (result.error === "target_not_found") return json(res, 404, { error: result.error });
      if (result.error === "report_rate_limited") return json(res, 429, { error: result.error });
      return json(res, 201, { reportId: result.reportId, status: result.status });
    } catch {
      log("Report persistence failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/reports" && req.method === "GET") {
    try {
      const reports = await createModerationStore().listReports(caller.$id);
      return json(res, 200, { reports });
    } catch {
      log("Report lookup failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/blocks" && req.method === "POST") {
    const checked = validateBlockTarget(body.targetUserId, caller.$id);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const result = await createModerationStore().createBlock(caller.$id, checked.value);
      if (result.error) return json(res, 404, { error: result.error });
      return json(res, 200, {
        blocked: true,
        alreadyBlocked: Boolean(result.alreadyExists)
      });
    } catch {
      log("Block persistence failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/blocks" && req.method === "DELETE") {
    const checked = validateBlockTarget(body.targetUserId, caller.$id);
    if (!checked.ok) return json(res, 400, { error: checked.error });
    try {
      const removed = await createModerationStore().removeBlock(caller.$id, checked.value);
      return json(res, 200, { unblocked: removed });
    } catch {
      log("Block removal failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route === "/blocks" && req.method === "GET") {
    try {
      const blocks = await createModerationStore().listBlocks(caller.$id);
      return json(res, 200, { blocks });
    } catch {
      log("Block list lookup failed; request details were not logged.");
      return json(res, 503, { error: "service_unavailable" });
    }
  }

  if (route.startsWith("/moderation")) {
    if (!isModerator(caller.$id, process.env.NOX_MODERATOR_USER_IDS ?? "")) {
      return json(res, 403, { error: "forbidden" });
    }
    return json(res, 501, { error: "not_implemented", feature: "moderation_operations" });
  }

  return json(res, 404, { error: "not_found" });
};
