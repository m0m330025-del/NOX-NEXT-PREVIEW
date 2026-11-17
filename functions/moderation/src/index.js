import { Client, Account } from "node-appwrite";
import { isModerator, validateBlockTarget, validateReportInput } from "./policy.js";

const json = (res, status, body) => res.json(body, status);

function getRoute(path = "") {
  return path.replace(/\/+$/, "") || "/";
}

export default async ({ req, res, log }) => {
  if (req.method === "OPTIONS") {
    return res.text("", 204);
  }

  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return json(res, 405, { error: "method_not_allowed" });
  }

  const jwt = req.headers?.["x-appwrite-user-jwt"];
  if (!jwt) {
    return json(res, 401, { error: "authentication_required" });
  }

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  if (!endpoint || !projectId) {
    log("Moderation function is missing required Appwrite runtime configuration.");
    return json(res, 503, { error: "service_unavailable" });
  }

  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(jwt);

    // Calling Account.get() validates the invoking session with Appwrite.
    const account = new Account(client);
    const caller = await account.get();
    const route = getRoute(req.path);
    const body = req.bodyJson ?? {};

    if (route === "/reports" && req.method === "POST") {
      const checked = validateReportInput(body);
      if (!checked.ok) return json(res, 400, { error: checked.error });

      // Persistence is deliberately not enabled until the reviewed
      // TablesDB schema, evidence policy, and function scopes are configured.
      return json(res, 501, { error: "not_implemented", feature: "report_submission" });
    }

    if (route === "/blocks" && req.method === "POST") {
      const checked = validateBlockTarget(body.targetUserId, caller.$id);
      if (!checked.ok) return json(res, 400, { error: checked.error });

      // Persistence and cross-direction enforcement require all relevant
      // private interaction endpoints to be routed through trusted Functions.
      return json(res, 501, { error: "not_implemented", feature: "block_user" });
    }

    if (route === "/blocks" && req.method === "GET") {
      return json(res, 501, { error: "not_implemented", feature: "list_my_blocks" });
    }

    if (route.startsWith("/moderation")) {
      const moderatorIds = process.env.NOX_MODERATOR_USER_IDS ?? "";
      if (!isModerator(caller.$id, moderatorIds)) {
        return json(res, 403, { error: "forbidden" });
      }
      // Authorization is in place; moderation queue/actions remain deliberately
      // disabled until audit, appeal, retention, and TablesDB write paths ship.
      return json(res, 501, { error: "not_implemented", feature: "moderation_operations" });
    }

    return json(res, 404, { error: "not_found" });
  } catch (err) {
    // Do not log tokens, request bodies, or private report content.
    log("Moderation request failed authentication or processing.");
    return json(res, 401, { error: "authentication_failed" });
  }
};
