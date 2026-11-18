const FILTERS = {
  none:"none",
  paris:"saturate(1.16) contrast(1.03) sepia(.08) brightness(1.04) hue-rotate(-7deg)",
  golden:"sepia(.28) saturate(1.35) contrast(1.04) brightness(1.05)",
  cool:"saturate(.92) contrast(1.08) brightness(1.04) hue-rotate(12deg)",
  vintage:"sepia(.42) saturate(.78) contrast(1.12) brightness(.96)",
  dream:"saturate(1.2) contrast(.9) brightness(1.12) blur(.25px)",
  mono:"grayscale(1) contrast(1.08)",
  korean:"brightness(1.08) saturate(1.08) contrast(.94) hue-rotate(-8deg)",
  chinese:"saturate(1.2) contrast(1.05) sepia(.12) hue-rotate(-12deg)",
  american:"contrast(1.18) saturate(1.28) brightness(1.02)",
  russian:"saturate(.78) contrast(1.12) brightness(1.06) hue-rotate(8deg)",
  retro70:"sepia(.36) saturate(1.2) contrast(.92)",
  film:"contrast(1.16) saturate(.86) brightness(.98)",
  noir:"grayscale(1) contrast(1.55) brightness(.82)",
  roseMakeup:"saturate(1.22) hue-rotate(-12deg) brightness(1.04)",
  glamMakeup:"saturate(1.18) contrast(1.06) brightness(1.06)",
  festival:"saturate(1.5) hue-rotate(24deg) contrast(1.08)",
  neonMakeup:"saturate(1.45) hue-rotate(48deg) contrast(1.1)",
  bigEyes:"saturate(1.12) contrast(1.08)",
  alien:"hue-rotate(75deg) saturate(1.5) contrast(1.12)",
  pixel:"contrast(1.35) saturate(1.3)",
  mirror:"contrast(1.08) saturate(1.1)"
};

export function initCameraFilters() {
  const modal = document.getElementById("camera-studio");
  const video = document.getElementById("camera-studio-video");
  if (!modal || !video) return;
  const preview = document.getElementById("camera-preview-wrap");
  const status = document.getElementById("camera-studio-status");
  const title = document.getElementById("camera-studio-title");
  const description = document.getElementById("camera-studio-description");
  const note = document.getElementById("camera-studio-note");
  const overlay = document.getElementById("camera-effect-overlay");
  const zoom = document.getElementById("camera-zoom");
  const zoomValue = document.getElementById("camera-zoom-value");
  const start = document.getElementById("camera-studio-start");
  const stop = document.getElementById("camera-studio-stop");
  let stream = null;
  let returnFocus = null;
  let currentMode = "story";

  function stopCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    preview.classList.remove("is-live");
    start.disabled = false;
    stop.disabled = true;
    status.textContent = "الكاميرا متوقفة";
  }

  function close() {
    stopCamera();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }

  function setFilter(name) {
    video.style.setProperty("--camera-filter", FILTERS[name] || "none");
    video.dataset.filter = name;
    overlay.dataset.filter = name;
    document.querySelectorAll("[data-camera-filter]").forEach(button => {
      const active = button.dataset.cameraFilter === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setEffect(name) {
    overlay.dataset.effect = name;
    document.querySelectorAll("[data-camera-effect]").forEach(button => {
      const active = button.dataset.cameraEffect === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function open(mode) {
    currentMode = mode === "call" ? "call" : "story";
    returnFocus = document.activeElement;
    title.textContent = currentMode === "call" ? "فلاتر مكالمات الفيديو" : "كاميرا الحالات";
    description.textContent = currentMode === "call" ? "معاينة شكل الفلاتر التي ستُستخدم داخل واجهة المكالمة" : "اختَر التأثير وشاهد المعاينة المباشرة قبل تجهيز الحالة";
    note.textContent = currentMode === "call"
      ? "هذه معاينة واجهة الفلاتر فقط؛ مكالمات الفيديو نفسها لم تُربط بعد. لا يتم تسجيل أو رفع الصورة أو تشغيل الميكروفون."
      : "الفلاتر تعمل محليًا على المعاينة فقط. لا يتم تسجيل أو رفع الصور أو تشغيل الميكروفون.";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector("button.camera-studio-close")?.focus();
  }

  document.querySelectorAll('[data-action="open-camera-studio"]').forEach(button => {
    button.addEventListener("click", () => open(button.dataset.cameraMode));
  });
  modal.querySelectorAll("[data-camera-close]").forEach(button => button.addEventListener("click", close));
  document.querySelectorAll("[data-camera-filter]").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.cameraFilter)));
  document.querySelectorAll("[data-camera-effect]").forEach(button => button.addEventListener("click", () => setEffect(button.dataset.cameraEffect)));

  start.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = "المتصفح لا يدعم تشغيل الكاميرا. استخدم متصفحًا حديثًا واتصالًا آمنًا.";
      return;
    }
    start.disabled = true;
    status.textContent = "بانتظار إذن الكاميرا…";
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (!modal.classList.contains("open")) {
        nextStream.getTracks().forEach(track => track.stop());
        start.disabled = false;
        return;
      }
      stream = nextStream;
      video.srcObject = stream;
      await video.play();
      preview.classList.add("is-live");
      stop.disabled = false;
      status.textContent = "المعاينة تعمل — الميكروفون غير مستخدم";
    } catch (error) {
      start.disabled = false;
      status.textContent = error?.name === "NotAllowedError" ? "لم تسمح للمتصفح باستخدام الكاميرا." : "تعذر تشغيل الكاميرا؛ تحقق من الإذن أو اتصال HTTPS.";
      if (stream) stream.getTracks().forEach(track => track.stop());
      stream = null;
      video.srcObject = null;
      preview.classList.remove("is-live");
      stop.disabled = true;
    }
  });
  stop.addEventListener("click", stopCamera);
  zoom?.addEventListener("input", () => {
    const value = Number(zoom.value) || 1;
    video.style.setProperty("--camera-zoom", String(value));
    zoomValue.textContent = `${value.toFixed(1)}×`;
  });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const items = [...modal.querySelectorAll('button:not([disabled])')].filter(item => item.getClientRects().length);
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
  });
  setFilter("none");
  setEffect("none");
  if (zoom) { zoom.value = "1"; video.style.setProperty("--camera-zoom", "1"); }
}
