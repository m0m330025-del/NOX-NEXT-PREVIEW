// TEMPORARY UI PREVIEW ONLY.
// This bypass is intentionally limited to the preview branch and is NOT authentication.
const params = new URLSearchParams(window.location.search);
let previewMode = params.get("noxPreview") === "1";
try {
  if (previewMode) sessionStorage.setItem("nox:preview-mode", "1");
  previewMode = previewMode || sessionStorage.getItem("nox:preview-mode") === "1";
} catch (_) {
  // The explicit URL flag still permits this tab's initial preview.
}

function showPreviewNotice() {
  if (document.getElementById("nox-preview-notice")) return;
  const notice = document.createElement("div");
  notice.id = "nox-preview-notice";
  notice.textContent = "وضع المعاينة المؤقتة — تسجيل الدخول معطّل، والبيانات المعروضة تجريبية وليست حسابات حقيقية.";
  Object.assign(notice.style, {
    position: "fixed", left: "12px", right: "12px", bottom: "12px",
    zIndex: "2147483647", padding: "12px 16px", borderRadius: "12px",
    background: "#24124f", color: "#fff", border: "1px solid #c7a7ff",
    boxShadow: "0 8px 28px rgba(0,0,0,.28)", textAlign: "center",
    font: "600 13px/1.6 system-ui, sans-serif"
  });
  document.body.appendChild(notice);
}

if (previewMode) {
  document.documentElement.classList.remove("auth-pending");
  document.documentElement.dataset.noxPreview = "true";
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showPreviewNotice, { once: true });
  } else {
    showPreviewNotice();
  }
  window.dispatchEvent(new CustomEvent("nox:preview"));
} else {
  // Normal authentication remains unchanged outside explicit preview mode.
  import("./auth-client.js").then(({ getCurrentUser }) => getCurrentUser())
    .then(user => {
      if (!user) {
        window.location.replace("./login.html");
        return;
      }
      document.documentElement.classList.remove("auth-pending");
      window.dispatchEvent(new CustomEvent("nox:authenticated", { detail: { userId: user.$id } }));
    })
    .catch(() => window.location.replace("./login.html"));
}
