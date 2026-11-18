import { getCurrentUser } from "./auth-client.js";

// Keep protected content hidden until Appwrite confirms the browser session.
try {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace("./login.html");
  } else {
    document.documentElement.classList.remove("auth-pending");
    window.dispatchEvent(new CustomEvent("nox:authenticated", { detail: { userId: user.$id } }));
  }
} catch (_) {
  window.location.replace("./login.html");
}
