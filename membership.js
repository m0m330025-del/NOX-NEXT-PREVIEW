// NOX membership preview only. No entitlement or wallet data is fabricated here.
const thresholds = [
  { name: "Silver", value: 50000 },
  { name: "Gold", value: 500000 },
  { name: "Premium", value: 5000000 },
  { name: "Premium Gold", value: 500000000 },
  { name: "Premium Black", value: null }
];

function render() {
  // Progress is intentionally unavailable until the authenticated backend supplies it.
  document.getElementById("currentLevel").textContent = "بانتظار بيانات الحساب";
  document.getElementById("currentThreshold").textContent = "—";
  document.getElementById("nextLevel").textContent = "Silver";
  document.getElementById("progressValue").textContent = "—";
  document.getElementById("metricLabel").textContent =
    "سيُحدد المقياس تلقائيًا: الهدايا المرسلة أو المستلمة حسب نوع الحساب";
  document.getElementById("barFill").style.width = "0%";
  document.getElementById("remaining").textContent =
    "الحد الأول Silver هو 50,000 NXC — التقدم ينتظر بيانات الخادم";
  document.getElementById("nextName").textContent = "Silver";
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item =>
      item.classList.toggle("active", item === button)
    );
    document.querySelectorAll("[data-panel]").forEach(panel =>
      panel.classList.toggle("active", panel.dataset.panel === button.dataset.tab)
    );
  });
});

document.querySelectorAll("[data-frame]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-frame]").forEach(item => {
      item.classList.remove("selected-frame");
      item.textContent = "معاينة الإطار";
    });
    button.classList.add("selected-frame");
    button.textContent = "تم اختيار المعاينة";
    const toast = document.getElementById("toast");
    toast.textContent = "معاينة فقط — لم يتم حفظ الإطار أو تغيير استحقاق الحساب";
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2600);
  });
});

render();
