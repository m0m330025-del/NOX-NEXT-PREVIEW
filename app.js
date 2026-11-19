import { initCallSettings } from "./core/call-settings.js";
import { initNavigation } from "./core/navigation.js";
import { initTheme } from "./core/theme.js";
import { initApp } from "./core/app.js";
import { initAuthSession } from "./core/session.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await initAuthSession())) return;
  initTheme();
  initNavigation();
  initApp();
  initCallSettings();
});
