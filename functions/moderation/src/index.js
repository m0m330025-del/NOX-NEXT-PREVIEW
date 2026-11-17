import { Client, Account } from "node-appwrite";
import { isModerator, validateBlockTarget, validateReportInput } from "./policy.js";
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
