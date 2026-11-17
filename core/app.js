export function initApp() {
  const toast = document.getElementById("toast");
  let toastTimer;

  function showNotice(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  window.addEventListener("nox:notice", event => showNotice(event.detail));

  document.querySelectorAll('[data-action="demo-notice"]').forEach(button => {
    button.addEventListener("click", () => {
      showNotice("هذه الخاصية واجهة تجريبية وستُفعّل في مرحلة لاحقة");
    });
  });

  document.querySelector('[data-action="focus-search"]')?.addEventListener("click", () => {
    document.getElementById("global-search")?.focus();
    showNotice("البحث الكامل سيُفعّل مع نظام الأعضاء");
  });

  document.querySelectorAll('[data-action="like"]').forEach(button => {
    button.addEventListener("click", () => {
      const liked = button.classList.toggle("liked");
      button.firstChild.textContent = liked ? "♥ " : "♡ ";
      button.setAttribute("aria-pressed", String(liked));
    });
  });

  const search = document.getElementById("global-search");
  search?.addEventListener("keydown", event => {
    if (event.key === "Enter" && search.value.trim()) {
      showNotice("البحث عن الأعضاء والمحتوى سيُربط بقاعدة البيانات لاحقًا");
    }
  });

  // NOX NEXT friend add flow (front-end preview; server verification comes later).
  const friendNotice = message => window.dispatchEvent(new CustomEvent("nox:notice", { detail: message }));
  const friendModal = document.getElementById("friend-modal");
  const camera = document.getElementById("friend-camera");
  const cameraStatus = document.getElementById("camera-status");
  const scannerPlaceholder = document.getElementById("scanner-placeholder");
  const scanFrame = document.querySelector(".scanner-frame");
  const friendResult = document.getElementById("friend-result");
  let cameraStream = null;
  let scanLoop = false;
  let detector = null;
  let pendingFriendId = "";
  const ownNoxId = (localStorage.getItem("noxUserId") || localStorage.getItem("nox_id") || localStorage.getItem("NOX_ID") || "NOX-123-456").toUpperCase();

  function stopFriendCamera() {
    scanLoop = false;
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    if (camera) camera.srcObject = null;
    scanFrame?.classList.remove("scanning");
    const stopButton = document.getElementById("stop-scan");
    if (stopButton) stopButton.disabled = true;
  }

  function showFriendResult(rawId) {
    const cleanId = String(rawId || "").trim().toUpperCase();
    if (!/^NOX-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$/.test(cleanId)) {
      friendNotice("رمز NOX ID غير صحيح");
      return;
    }
    pendingFriendId = cleanId;
    document.getElementById("result-name").textContent = "حساب NOX";
    document.getElementById("result-id").textContent = cleanId;
    friendResult.hidden = false;
    friendNotice("تمت قراءة NOX ID — راجع الحساب قبل إرسال الطلب");
  }

  function switchFriendTab(tab) {
    document.querySelectorAll("[data-friend-tab]").forEach(button => {
      const active = button.dataset.friendTab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-friend-pane]").forEach(pane => {
      const active = pane.dataset.friendPane === tab;
      pane.hidden = !active;
      pane.classList.toggle("active", active);
    });
    friendResult.hidden = true;
    if (tab !== "scan") stopFriendCamera();
    if (tab === "myqr") renderMyQr();
  }

  function renderMyQr() {
    const holder = document.getElementById("my-qr-code");
    document.getElementById("my-nox-id").textContent = ownNoxId;
    if (!holder || holder.dataset.ready === ownNoxId) return;
    holder.dataset.ready = ownNoxId;
    holder.innerHTML = "";
    const draw = () => {
      if (window.QRCode) {
        new window.QRCode(holder, { text: ownNoxId, width: 160, height: 160, colorDark: "#263746", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
      } else holder.textContent = ownNoxId;
    };
    if (window.QRCode) draw();
    else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = draw;
      script.onerror = () => { holder.textContent = ownNoxId; };
      document.head.appendChild(script);
    }
  }

  async function startFriendCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.textContent = "المتصفح لا يدعم فتح الكاميرا هنا. استخدم إدخال NOX ID.";
      return;
    }
    if (!("BarcodeDetector" in window)) {
      cameraStatus.textContent = "المتصفح لا يدعم قراءة QR تلقائيًا. استخدم إدخال NOX ID أو جرّب متصفحًا أحدث.";
      return;
    }
    try {
      detector = new BarcodeDetector({ formats: ["qr_code"] });
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      camera.srcObject = cameraStream;
      await camera.play();
      scanFrame.classList.add("scanning");
      scannerPlaceholder.style.display = "none";
      document.getElementById("stop-scan").disabled = false;
      cameraStatus.textContent = "وجّه الكاميرا نحو رمز QR الخاص بصديقك";
      scanLoop = true;
      const scanFrameLoop = async () => {
        if (!scanLoop || !cameraStream) return;
        try {
          const codes = await detector.detect(camera);
          if (codes.length && codes[0].rawValue) {
            const match = codes[0].rawValue.trim().match(/NOX-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}/i);
            if (match) {
              stopFriendCamera();
              scannerPlaceholder.style.display = "flex";
              showFriendResult(match[0]);
              return;
            }
          }
        } catch (_) {}
        if (scanLoop) window.setTimeout(scanFrameLoop, 350);
      };
      scanFrameLoop();
    } catch (error) {
      cameraStatus.textContent = error?.name === "NotAllowedError" ? "لم يتم السماح باستخدام الكاميرا. يمكنك إدخال NOX ID يدويًا." : "تعذر تشغيل الكاميرا. تحقق من إذن الكاميرا أو استخدم NOX ID.";
      stopFriendCamera();
    }
  }

  document.querySelectorAll('[data-action="open-friends"]').forEach(button => {
    button.addEventListener("click", () => {
      friendModal?.classList.add("open");
      friendModal?.setAttribute("aria-hidden", "false");
      switchFriendTab("scan");
    });
  });
  document.querySelectorAll('[data-action="close-friends"]').forEach(button => {
    button.addEventListener("click", () => {
      stopFriendCamera();
      friendModal?.classList.remove("open");
      friendModal?.setAttribute("aria-hidden", "true");
    });
  });
  document.querySelectorAll("[data-friend-tab]").forEach(button => {
    button.addEventListener("click", () => switchFriendTab(button.dataset.friendTab));
  });
  document.getElementById("start-scan")?.addEventListener("click", startFriendCamera);
  document.getElementById("stop-scan")?.addEventListener("click", () => {
    stopFriendCamera();
    scannerPlaceholder.style.display = "flex";
    cameraStatus.textContent = "تم إيقاف المسح";
  });
  document.getElementById("find-friend")?.addEventListener("click", () => showFriendResult(document.getElementById("friend-id-input").value));
  document.getElementById("friend-id-input")?.addEventListener("keydown", event => {
    if (event.key === "Enter") showFriendResult(event.currentTarget.value);
  });
  document.getElementById("send-friend-request")?.addEventListener("click", () => {
    if (!pendingFriendId || pendingFriendId === ownNoxId) {
      friendNotice(pendingFriendId === ownNoxId ? "لا يمكنك إضافة حسابك كصديق" : "ابحث عن NOX ID أولًا");
      return;
    }
    const requests = JSON.parse(localStorage.getItem("noxFriendRequests") || "[]");
    if (requests.includes(pendingFriendId)) {
      friendNotice("سبق حفظ طلب لهذا الحساب على هذا الجهاز");
      return;
    }
    requests.push(pendingFriendId);
    localStorage.setItem("noxFriendRequests", JSON.stringify(requests));
    friendNotice("تم حفظ طلب تجريبي على هذا الجهاز — الإرسال الفعلي يحتاج خادم NOX");
    friendResult.hidden = true;
    document.getElementById("friend-id-input").value = "";
  });
  document.getElementById("copy-my-id")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ownNoxId);
      friendNotice("تم نسخ NOX ID");
    } catch (_) {
      friendNotice("NOX ID الخاص بك: " + ownNoxId);
    }
  });
  friendModal?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      stopFriendCamera();
      friendModal.classList.remove("open");
      friendModal.setAttribute("aria-hidden", "true");
    }
  });

}
