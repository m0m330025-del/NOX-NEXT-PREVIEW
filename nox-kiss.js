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
    if (kind !== "friends") {
      document.getElementById("otherTitle").textContent = kind === "chat" ? "الدردشة" : "الأغاني";
      document.getElementById("otherText").textContent = "هذه النافذة توضيحية في النموذج؛ لم يتم ربط الخدمة بعد.";
    }
    other.hidden = false; panel.hidden = true;
  }));
  document.getElementById("closeOther").addEventListener("click", () => { other.hidden = true; stopScanner(); });
  
  // Local-only avatar reference preview. No image is uploaded or persisted.
  const avatarBuilder = document.getElementById("avatarBuilder");
  const avatarPhoto = document.getElementById("avatarPhoto");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarNotice = document.getElementById("avatarNotice");
  let avatarObjectUrl = null;
  document.getElementById("openAvatarBuilder").addEventListener("click", () => {
    avatarBuilder.hidden = false; other.hidden = true; panel.hidden = true;
  });
  document.getElementById("closeAvatarBuilder").addEventListener("click", () => {
    avatarBuilder.hidden = true;
    avatarPhoto.value = "";
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    avatarObjectUrl = null;
    avatarPreview.textContent = "معاينة الصورة ستظهر هنا";
  });
  avatarPhoto.addEventListener("change", () => {
    const file = avatarPhoto.files && avatarPhoto.files[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5*1024*1024) {
      avatarPhoto.value = "";
      avatarNotice.textContent = "اختر صورة JPG أو PNG أو WEBP بحجم لا يتجاوز 5 ميجابايت.";
      return;
    }
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    avatarObjectUrl = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.alt = "معاينة الصورة المرجعية";
    img.src = avatarObjectUrl;
    avatarPreview.replaceChildren(img);
    avatarNotice.textContent = "تم عرض الصورة محليًا فقط. إنشاء مجسم 3D مطابق يحتاج إلى خدمة متخصصة وربط آمن.";
  });
  document.getElementById("buildAvatar").addEventListener("click", () => {
    avatarNotice.textContent = "خدمة تحويل الصور إلى مجسمات 3D غير مفعّلة بعد.";
  });

  const myId = localStorage.getItem("noxDemoId") || ("NOX-" + Math.floor(100+Math.random()*900) + "-" + Math.floor(100+Math.random()*900));
  localStorage.setItem("noxDemoId", myId);
  document.getElementById("myNoxId").textContent = myId;
  if (window.QRCode) new QRCode(document.getElementById("myNoxQr"), {text:myId,width:132,height:132,colorDark:"#183d36",colorLight:"#ffffff"});
  document.getElementById("copyNoxId").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(myId); document.getElementById("friendNotice").textContent="تم نسخ NOX ID."; }
    catch { document.getElementById("friendNotice").textContent="انسخ المعرّف يدويًا: "+myId; }
  });

  const friends = JSON.parse(localStorage.getItem("noxDemoFriends") || "[]");
  const friendInput = document.getElementById("friendNoxId");
  const friendNotice = document.getElementById("friendNotice");
  const friendList = document.getElementById("friendList");
  function renderFriends() {
    friendList.innerHTML = "";
    friends.forEach(id => { const li=document.createElement("li"); li.textContent=id; friendList.appendChild(li); });
  }
  function addFriend(rawId) {
    const id=String(rawId || "").trim().toUpperCase();
    if (!/^NOX-\d{3}-\d{3}$/.test(id)) { friendNotice.textContent="صيغة المعرّف غير صحيحة. استخدم NOX-123-456."; return; }
    if (id===myId) { friendNotice.textContent="هذا هو معرّفك أنت."; return; }
    if (friends.includes(id)) { friendNotice.textContent="هذا الصديق موجود بالفعل في قائمتك."; return; }
    friends.push(id); localStorage.setItem("noxDemoFriends",JSON.stringify(friends)); renderFriends();
    friendInput.value=""; friendNotice.textContent="تمت الإضافة إلى القائمة التجريبية على هذا الجهاز.";
  }
  document.getElementById("addFriend").addEventListener("click",()=>addFriend(friendInput.value));
  renderFriends();

  let scanner=null;
  function stopScanner() {
    if (scanner) { scanner.stop().catch(()=>{}); scanner.clear(); scanner=null; }
    document.getElementById("qr-reader").hidden=true;
  }
  document.getElementById("startQrScan").addEventListener("click", async () => {
    const reader=document.getElementById("qr-reader");
    if (!window.Html5Qrcode) { friendNotice.textContent="تعذر تحميل أداة مسح QR؛ تحقق من اتصال الإنترنت."; return; }
    reader.hidden=false; scanner=new Html5Qrcode("qr-reader");
    try {
      await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:220,height:220}},decoded=>{
        addFriend(decoded); stopScanner();
      },()=>{});
      friendNotice.textContent="وجّه الكاميرا إلى QR الخاص بصديقك.";
    } catch (err) {
      friendNotice.textContent="لم نتمكن من فتح الكاميرا. اسمح للمتصفح باستخدام الكاميرا وجرب مرة أخرى.";
      stopScanner();
    }
  });
});