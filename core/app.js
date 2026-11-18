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

  // Real browser-session logout. Load the same pinned Appwrite Web SDK used by login.html.
  const logoutButton = document.querySelector('[data-action="logout"]');
  logoutButton?.addEventListener("click", async () => {
    if (logoutButton.disabled) return;
    logoutButton.disabled = true;
    showNotice("جارٍ تسجيل الخروج…");
    try {
      if (!window.Appwrite?.Client || !window.Appwrite?.Account) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/appwrite@29.0.0";
          script.onload = resolve;
          script.onerror = () => reject(new Error("تعذر تحميل خدمة تسجيل الخروج"));
          document.head.appendChild(script);
        });
      }
      const { closeCurrentSession } = await import("./auth-client.js");
      await closeCurrentSession();
      window.location.replace("./login.html");
    } catch (error) {
      logoutButton.disabled = false;
      showNotice("تعذر إكمال تسجيل الخروج الآن. تحقق من الاتصال ثم أعد المحاولة.");
    }
  });


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

  // Treat browser storage as optional and untrusted; storage can be blocked by the browser.
  function readStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function readStoredArray(key) {
    try {
      const value = JSON.parse(readStoredValue(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

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
  let friendModalReturnFocus = null;
  const ownNoxId = (readStoredValue("noxDemoId") || readStoredValue("noxUserId") || readStoredValue("nox_id") || readStoredValue("NOX_ID") || "NOX-123-456").toUpperCase();

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
    document.getElementById("result-name").textContent = "معرّف NOX";
    document.getElementById("result-id").textContent = cleanId;
    friendResult.hidden = false;
    friendNotice("صيغة المعرّف صحيحة. لا يمكن تأكيد وجود الحساب قبل ربط الخادم.");
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
    if (tab === "requests") renderFriendRequests();
  }

  function renderFriendRequests() {
    const incomingBox = document.getElementById("incoming-requests");
    const sentBox = document.getElementById("sent-requests");
    if (!incomingBox || !sentBox) return;
    const incoming = readStoredArray("noxIncomingFriendRequests").filter(item => item && typeof item === "object" && typeof item.id === "string");
    const sent = readStoredArray("noxFriendRequests").filter(id => typeof id === "string");
    const accepted = readStoredArray("noxAcceptedFriends").filter(id => typeof id === "string");
    incomingBox.innerHTML = "";
    sentBox.innerHTML = "";
    const pendingIncoming = incoming.filter(item => !accepted.includes(item.id));
    if (!pendingIncoming.length) incomingBox.innerHTML = '<p class="request-empty">لا توجد طلبات صداقة واردة حاليًا</p>';
    pendingIncoming.forEach(item => {
      const row = document.createElement("div"); row.className = "request-row";
      const info = document.createElement("div"); info.className = "request-info";
      const name = document.createElement("b"); name.textContent = item.name || "عضو NOX";
      const id = document.createElement("small"); id.textContent = item.id;
      info.append(name,id);
      const actions = document.createElement("div"); actions.className = "request-actions";
      const accept = document.createElement("button"); accept.className = "request-accept"; accept.textContent = "قبول";
      accept.addEventListener("click", () => {
        const list = readStoredArray("noxAcceptedFriends").filter(id => typeof id === "string");
        if (!list.includes(item.id)) list.push(item.id);
        const previousAccepted = readStoredValue("noxAcceptedFriends");
        const previousIncoming = readStoredValue("noxIncomingFriendRequests");
        if (!writeStoredValue("noxAcceptedFriends", JSON.stringify(list)) ||
            !writeStoredValue("noxIncomingFriendRequests", JSON.stringify(incoming.filter(entry => entry.id !== item.id)))) {
          writeStoredValue("noxAcceptedFriends", previousAccepted ?? "[]");
          writeStoredValue("noxIncomingFriendRequests", previousIncoming ?? "[]");
          friendNotice("تعذر حفظ التغيير في هذا المتصفح؛ لم يكتمل تحديث الطلب.");
          return;
        }
        friendNotice("تم قبول الطلب في المعاينة المحلية"); renderFriendRequests();
      });
      const reject = document.createElement("button"); reject.className = "request-reject"; reject.textContent = "رفض";
      reject.addEventListener("click", () => {
        if (!writeStoredValue("noxIncomingFriendRequests", JSON.stringify(incoming.filter(entry => entry.id !== item.id)))) {
          friendNotice("تعذر حفظ التغيير في هذا المتصفح.");
          return;
        }
        friendNotice("تم رفض الطلب في المعاينة المحلية"); renderFriendRequests();
      });
      actions.append(accept,reject); row.append(info,actions); incomingBox.append(row);
    });
    const pendingSent = sent.filter(id => !accepted.includes(id));
    if (!pendingSent.length) sentBox.innerHTML = '<p class="request-empty">لم ترسل طلبات صداقة بعد</p>';
    pendingSent.forEach(id => {
      const row = document.createElement("div"); row.className = "request-row";
      const info = document.createElement("div"); info.className = "request-info";
      const name = document.createElement("b"); name.textContent = "طلب صداقة";
      const code = document.createElement("small"); code.textContent = id;
      info.append(name,code);
      const status = document.createElement("span"); status.className = "request-pending"; status.textContent = "بانتظار الرد";
      row.append(info,status); sentBox.append(row);
    });
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

  function closeFriendModal() {
    stopFriendCamera();
    friendModal?.classList.remove("open");
    friendModal?.setAttribute("aria-hidden", "true");
    if (friendModalReturnFocus instanceof HTMLElement && friendModalReturnFocus.isConnected) {
      friendModalReturnFocus.focus();
    }
    friendModalReturnFocus = null;
  }

  document.querySelectorAll('[data-action="open-friends"]').forEach(button => {
    button.addEventListener("click", () => {
      friendModalReturnFocus = document.activeElement;
      friendModal?.classList.add("open");
      friendModal?.setAttribute("aria-hidden", "false");
      switchFriendTab("scan");
      friendModal?.querySelector(".friend-close")?.focus();
    });
  });
  document.querySelectorAll('[data-action="close-friends"]').forEach(button => {
    button.addEventListener("click", closeFriendModal);
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
    const requests = readStoredArray("noxFriendRequests").filter(id => typeof id === "string");
    if (requests.includes(pendingFriendId)) {
      friendNotice("سبق إرسال طلب لهذا المعرّف على هذا الجهاز");
      return;
    }
    requests.push(pendingFriendId);
    if (!writeStoredValue("noxFriendRequests", JSON.stringify(requests))) {
      friendNotice("تعذر حفظ الطلب في هذا المتصفح.");
      return;
    }
    friendNotice("تم تسجيل الطلب في معاينة هذا الجهاز فقط — لم يُرسل لحساب آخر");
    friendResult.hidden = true;
    document.getElementById("friend-id-input").value = "";
    renderFriendRequests();
  });
  document.getElementById("friends-search")?.addEventListener("input", event => {
    const query = event.currentTarget.value.trim().toLocaleLowerCase("ar");
    document.querySelectorAll(".friend-list li").forEach(item => {
      item.hidden = !item.textContent.toLocaleLowerCase("ar").includes(query);
    });
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
      event.preventDefault();
      closeFriendModal();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...friendModal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getClientRects().length);
    if (!focusable.length) {
      event.preventDefault();
      friendModal.querySelector(".friend-close")?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

}
