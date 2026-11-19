import { getCurrentUser, getMembership, closeCurrentSession } from "./auth-client.js";

// Keep protected content hidden until both the Appwrite session and the
// server-owned APPROVED membership record have been verified.
try {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("./login.html");
  } else {
    const membership = await getMembership();
    if (membership.approved === true && membership.accountStatus === "APPROVED") {
      document.documentElement.classList.remove("auth-pending");
      window.dispatchEvent(new CustomEvent("nox:authenticated", { detail: { userId: user.$id } }));
    } else {
      await closeCurrentSession();
      window.location.replace("./login.html?reason=membership_required");
    }
  }
} catch (_) {
  try { await closeCurrentSession(); } catch (_) {}
  window.location.replace("./login.html?reason=membership_unavailable");
}
