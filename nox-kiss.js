"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("dancePanel");
  const other = document.getElementById("otherPanel");
  const status = document.getElementById("danceStatus");
  const avatars = [...document.querySelectorAll(".avatar")];
  const open = () => { panel.hidden = false; other.hidden = true; };
  const close = () => { panel.hidden = true; };
  document.getElementById("openDances").addEventListener("click", open);
  document.getElementById("closeDances").addEventListener("click", close);
  document.getElementById("closePanel").addEventListener("click", close);
  document.getElementById("stopDance").addEventListener("click", () => {
    avatars.forEach(a => a.classList.remove("dancing"));
    document.querySelectorAll(".dance-item").forEach(b => b.classList.remove("selected"));
    status.textContent = "تم إيقاف الحركة";
  });
  document.querySelectorAll(".dance-item").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".dance-item").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    avatars.forEach(a => a.classList.remove("dancing"));
    avatars[0].classList.add("dancing");
    status.textContent = "معاينة محلية: " + button.dataset.dance;
  }));
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".dance-item").forEach(item => {
      item.hidden = tab.dataset.category !== "all" && item.dataset.category !== tab.dataset.category;
    });
  }));
  document.querySelectorAll("[data-panel]").forEach(button => button.addEventListener("click", () => {
    const kind = button.dataset.panel;
    document.getElementById("otherTitle").textContent = kind === "chat" ? "الدردشة" : kind === "music" ? "الأغاني" : "البحث عن صديق";
    document.getElementById("otherText").textContent = "هذه النافذة توضيحية في النموذج؛ لم يتم ربط الخدمة بعد.";
    other.hidden = false; panel.hidden = true;
  }));
  document.getElementById("closeOther").addEventListener("click", () => { other.hidden = true; });
});