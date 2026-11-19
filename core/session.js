import { account } from "./auth.js";

export async function initAuthSession() {
  try {
    const user = await account.get();
    const name = document.querySelector(".topbar-user b");
    if (name) name.textContent = user.name || "حسابي";
    const logout = document.querySelector('[data-action="logout"]');
    logout?.addEventListener("click", async () => {
      logout.disabled = true;
      try {
        await account.deleteSession("current");
        window.location.replace("./login.html");
      } catch (error) {
        logout.disabled = false;
        window.dispatchEvent(new CustomEvent("nox:notice", { detail: "تعذر تسجيل الخروج: " + (error?.message || "حاول مرة أخرى.") }));
      }
    });
    return true;
  } catch {
    window.location.replace("./login.html");
    return false;
  }
}
