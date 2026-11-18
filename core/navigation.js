const labels = {
  friends: "قسم الأصدقاء",
  messages: "قسم المحادثات",
  calls: "قسم المكالمات",
  stories: "قسم الحالات",
  reels: "قسم المقاطع",
  gifts: "قسم الهدايا",
  settings: "الإعدادات"
};

const availableSections = new Set(["home", "stories", "friends"]);

export function initNavigation() {
  const links = document.querySelectorAll("[data-nav]");

  function setActiveNavigation(key) {
    links.forEach(item => {
      const active = item.dataset.nav === key;
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  const initiallyActive = document.querySelector("[data-nav].active");
  if (initiallyActive) setActiveNavigation(initiallyActive.dataset.nav);

  links.forEach(link => {
    link.addEventListener("click", event => {
      const key = link.dataset.nav;
      if (!availableSections.has(key)) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("nox:notice", {
          detail: labels[key] || "هذا القسم قيد التجهيز"
        }));
        return;
      }
      setActiveNavigation(key);
    });
  });

  document.querySelector('[data-action="more-menu"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("nox:notice", {
      detail: "الأقسام الإضافية ستظهر هنا عند تجهيزها"
    }));
  });
}
