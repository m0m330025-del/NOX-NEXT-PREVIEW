"use strict";
const form = document.getElementById("message-form");
const fileInput = document.getElementById("media-file-input");
const attachButton = document.getElementById("attach-media");
const staging = document.getElementById("attachment-staging");
const viewMode = document.getElementById("media-view-mode");
const countLabel = document.getElementById("attachment-count");
const chat = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const toast = document.getElementById("messages-toast");
const pending = [];
const runtimeMessages = new Map();
let serial = 0;
let viewer = null;
let viewerPreviousFocus = null;
let activeViewerItem = null;
const MAX_FILES = 10;
const MAX_BYTES = 50 * 1024 * 1024;
const allowedDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i;
function notice(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(notice.timer);
  notice.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}
function kindOf(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/") && ["video/mp4","video/webm","video/quicktime"].includes(file.type)) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (allowedDocument.test(file.name)) return "document";
  return "";
}
function release(item) {
  if (item.url) URL.revokeObjectURL(item.url);
  item.url = "";
}
function updateCount() {
  countLabel.textContent = pending.length ? `${pending.length} مرفق جاهز • الملفات مؤقتة` : "إرفاق صور أو فيديو أو ملفات";
  staging.hidden = pending.length === 0;
}
function renderStaging() {
  staging.replaceChildren();
  pending.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "staged-media-card";
    if (item.kind === "image") {
      const image = document.createElement("img");
      image.src = item.url; image.alt = item.name; card.append(image);
    } else {
      const glyph = document.createElement("span");
      glyph.className = "staged-file-icon";
      glyph.textContent = item.kind === "video" ? "▶" : item.kind === "audio" ? "♫" : "▤";
      card.append(glyph);
    }
    const details = document.createElement("span");
    details.className = "staged-media-name";
    details.textContent = item.name;
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "staged-remove";
    remove.textContent = "×"; remove.setAttribute("aria-label", "إزالة " + item.name);
    remove.addEventListener("click", () => {
      release(item); pending.splice(index, 1); renderStaging();
    });
    card.append(details, remove); staging.append(card);
  });
  updateCount();
}
attachButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const selected = [...fileInput.files];
  for (const file of selected) {
    if (pending.length >= MAX_FILES) { notice("الحد الأقصى 10 مرفقات في الرسالة"); break; }
    if (file.size > MAX_BYTES) { notice("حجم الملف يتجاوز 50 ميجابايت: " + file.name); continue; }
    const kind = kindOf(file);
    if (!kind) { notice("نوع الملف غير مدعوم: " + file.name); continue; }
    if (pending.some(entry => entry.name === file.name && entry.size === file.size && entry.type === file.type)) continue;
    pending.push({ file, name: file.name, size: file.size, type: file.type, kind, url: URL.createObjectURL(file) });
  }
  fileInput.value = "";
  renderStaging();
});
function viewLimit() {
  return viewMode.value === "once" ? 1 : viewMode.value === "normal" ? Infinity : Number(viewMode.value);
}
function makeMediaNode(item, messageId, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "inline-media-item";
  const state = Boolean(item.consumed) || item.viewed >= item.limit;
  if (state && item.limit !== Infinity) {
    wrapper.append(makeText("span", "media-consumed", "انتهت المشاهدات في المعاينة"));
    return wrapper;
  }
  if (item.kind === "image") {
    const image = document.createElement("img");
    image.src = item.url; image.alt = item.name; image.loading = "lazy";
    image.className = "inline-media-image";
    image.addEventListener("click", () => openMedia(messageId, index));
    image.tabIndex = 0; image.setAttribute("role", "button"); image.setAttribute("aria-label", "عرض الصورة " + item.name);
    image.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMedia(messageId,index); } });
    wrapper.append(image);
  } else if (item.kind === "video") {
    if (item.limit !== Infinity) {
      const open = document.createElement("button");
      open.type = "button"; open.className = "limited-media-open";
      open.textContent = "▶ فتح الفيديو • " + item.name;
      open.addEventListener("click", () => openMedia(messageId,index));
      wrapper.append(open);
    } else {
      const video = document.createElement("video");
      video.src = item.url; video.controls = true; video.playsInline = true; video.preload = "metadata";
      video.className = "inline-media-video";
      wrapper.append(video);
    }
  } else if (item.kind === "audio") {
    if (item.limit !== Infinity) {
      const open = document.createElement("button");
      open.type = "button"; open.className = "limited-media-open";
      open.textContent = "♫ فتح المقطع الصوتي • " + item.name;
      open.addEventListener("click", () => openMedia(messageId,index));
      wrapper.append(open);
    } else {
      const audio = document.createElement("audio");
      audio.src = item.url; audio.controls = true; audio.preload = "metadata";
      wrapper.append(audio);
    }
  } else {
    const file = document.createElement("button");
    file.type = "button"; file.className = "inline-document";
    file.textContent = "▤ " + item.name + " • " + formatSize(item.size);
    file.addEventListener("click", () => openMedia(messageId,index));
    wrapper.append(file);
  }
  const caption = item.limit === 1 ? "① عرض مرة واحدة" : item.limit === Infinity ? "عرض عادي" : `متبقي ${Math.max(0,item.limit-item.viewed)} من ${item.limit} مشاهدات`;
  wrapper.append(makeText("small","media-view-caption",caption + " • معاينة محلية"));
  return wrapper;
}
function makeText(tag, className, value) {
  const node = document.createElement(tag); node.className = className; node.textContent = value; return node;
}
function formatSize(bytes) {
  return bytes < 1024*1024 ? Math.max(1,Math.round(bytes/1024)) + " KB" : (bytes/(1024*1024)).toFixed(1) + " MB";
}
function appendRuntimeMessage(messageId) {
  const record = runtimeMessages.get(messageId);
  if (!record || record.conversationName !== document.getElementById("active-name").textContent || document.querySelector('[data-runtime-message="' + messageId + '"]')) return;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble sent media-message-bubble";
  bubble.dataset.runtimeMessage = messageId;
  if (record.caption) bubble.append(makeText("span","message-original",record.caption));
  const grid = document.createElement("div"); grid.className = "inline-media-grid";
  record.items.forEach((item,index) => grid.append(makeMediaNode(item,messageId,index)));
  bubble.append(grid);
  bubble.append(makeText("small","media-local-note","مرفقات مؤقتة في هذه المعاينة؛ لا يتم رفع الملفات أو حفظها بعد إعادة التحميل"));
  const meta = document.createElement("div"); meta.className = "message-meta";
  meta.append(makeText("time","message-time",record.time),makeText("span","message-ticks","✓✓"));
  bubble.append(meta);
  chat.append(bubble);
}
function renderRuntimeMessages() {
  for (const [id, record] of runtimeMessages) {
    if (record.conversationName !== document.getElementById("active-name").textContent) continue;
    const existing = document.querySelector('[data-runtime-message="' + id + '"]');
    if (!existing) {
      appendRuntimeMessage(id);
      continue;
    }
    const grid = existing.querySelector(".inline-media-grid");
    if (grid) {
      grid.replaceChildren();
      record.items.forEach((item,index) => grid.append(makeMediaNode(item,id,index)));
    }
  }
}
function openMedia(messageId,index) {
  const record = runtimeMessages.get(messageId);
  const item = record?.items[index];
  if (!item || (item.limit !== Infinity && item.viewed >= item.limit)) {
    notice("انتهت مرات المشاهدة المحددة في هذه المعاينة");
    return;
  }
  item.viewed += 1;
  activeViewerItem = item;
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.className = "media-viewer-backdrop";
    viewer.id = "media-viewer";
    viewer.setAttribute("role","dialog");
    viewer.setAttribute("aria-modal","true");
    viewer.setAttribute("aria-label","عارض الوسائط");
    const panel = document.createElement("section"); panel.className = "media-viewer-panel";
    const close = document.createElement("button"); close.type = "button"; close.className = "media-viewer-close"; close.textContent = "إغلاق";
    close.addEventListener("click", closeViewer);
    const body = document.createElement("div"); body.className = "media-viewer-content";
    const info = document.createElement("p"); info.className = "media-viewer-info";
    panel.append(close,body,info); viewer.append(panel); document.body.append(viewer);
    viewer.addEventListener("click",event => { if (event.target === viewer) closeViewer(); });
    viewer._body = body; viewer._info = info; viewer._close = close;
  }
  viewerPreviousFocus = document.activeElement;
  viewer._body.replaceChildren();
  if (item.kind === "image") {
    const image = document.createElement("img"); image.src = item.url; image.alt = item.name; viewer._body.append(image);
  } else if (item.kind === "video") {
    const video = document.createElement("video"); video.src = item.url; video.controls = true; video.autoplay = true; video.playsInline = true; viewer._body.append(video);
  } else {
    const link = document.createElement("a"); link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "فتح " + item.name; viewer._body.append(link);
  }
  viewer._info.textContent = item.limit === 1 ? "① تمت المشاهدة مرة واحدة — قيد محاكاة محلي" : item.limit === Infinity ? item.name : `المشاهدة ${item.viewed} من ${item.limit} — محاكاة محلية`;
  viewer.hidden = false; viewer._close.focus();
  viewer.classList.toggle("limited-view-active", item.limit !== Infinity);
  renderRuntimeMessages();
}
function closeViewer() {
  if (!viewer) return;
  const active = activeViewerItem;
  if (active && active.limit !== Infinity && active.viewed >= active.limit) {
    active.consumed = true;
    release(active);
  }
  activeViewerItem = null;
  viewer.remove(); viewer = null;
  renderRuntimeMessages();
  if (viewerPreviousFocus?.isConnected) viewerPreviousFocus.focus();
}
document.addEventListener("keydown",event => {
  if (event.key === "Escape" && viewer) closeViewer();
});
form.addEventListener("submit",event => {
  if (!pending.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const caption = messageInput.value.trim();
  const now = new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  const id = "media-" + Date.now() + "-" + (++serial);
  const limit = viewLimit();
  const items = pending.splice(0).map(entry => ({...entry,limit: entry.kind === "document" ? Infinity : limit,viewed:0,consumed:false}));
  const conversationName = document.getElementById("active-name").textContent;
  runtimeMessages.set(id,{caption,items,time:now,conversationName});
  const bubble = document.createElement("div");
  bubble.className = "message-bubble sent media-message-bubble";
  bubble.dataset.runtimeMessage = id;
  if (caption) bubble.append(makeText("span","message-original",caption));
  const grid = document.createElement("div"); grid.className = "inline-media-grid";
  items.forEach((item,index) => grid.append(makeMediaNode(item,id,index)));
  bubble.append(grid,makeText("small","media-local-note","مرفقات مؤقتة في المعاينة فقط • " + (limit === 1 ? "عرض مرة واحدة" : limit === Infinity ? "عرض عادي" : limit + " مشاهدات")));
  const meta = document.createElement("div"); meta.className = "message-meta";
  meta.append(makeText("time","message-time",now),makeText("span","message-ticks","✓✓")); bubble.append(meta);
  chat.append(bubble); chat.scrollTop = chat.scrollHeight;
  messageInput.value = ""; renderStaging(); viewMode.value = "normal";
  notice("أُضيفت الوسائط إلى المحادثة محليًا فقط؛ لم تُرسل إلى مستلم");
},true);
window.addEventListener("nox:chat-rendered", renderRuntimeMessages);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && viewer && activeViewerItem?.limit !== Infinity) closeViewer();
});
for (const eventName of ["contextmenu","copy","cut","dragstart"]) {
  document.addEventListener(eventName, event => {
    if (viewer?.classList.contains("limited-view-active") && viewer.contains(event.target)) event.preventDefault();
  }, true);
}
renderRuntimeMessages();
window.addEventListener("pagehide",() => {
  pending.forEach(release);
  for (const record of runtimeMessages.values()) record.items.forEach(release);
});
