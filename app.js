import { initNavigation } from "./core/navigation.js";
import { initTheme } from "./core/theme.js";
import { initApp } from "./core/app.js";
import { initCameraFilters } from "./core/camera-filters.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initApp();
  initCameraFilters();
});
