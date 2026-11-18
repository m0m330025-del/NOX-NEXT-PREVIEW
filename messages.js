const conversations = [
  { id:"sara", name:"سارة", initial:"س", preview:"أهلًا! كيف كان يومك؟", time:"10:42", unread:true, messages:[{from:"them",text:"صباح الخير! أخبارك إيه؟",time:"10:38"},{from:"me",text:"الحمد لله، يوم جميل لحد دلوقتي.",time:"10:40"},{from:"them",text:"أهلًا! كيف كان يومك؟",time:"10:42"}] },
  { id:"mariam", name:"مريم", initial:"م", preview:"شكرًا على المساعدة 🌷", time:"أمس", unread:false, messages:[{from:"them",text:"كنت حابة أشكرك على المساعدة 🌷",time:"أمس"}] },
  { id:"ahmed", name:"أحمد", initial:"أ", preview:"نتكلم لاحقًا إن شاء الله", time:"أمس", unread:false, messages:[{from:"me",text:"تمام، نتكلم لاحقًا إن شاء الله.",time:"أمس"}] },
  { id:"layla", name:"ليلى", initial:"ل", preview:"هل وصلتك الصور؟", time:"الثلاثاء", unread:true, messages:[{from:"them",text:"هل وصلتك الصور؟",time:"الثلاثاء"}] },
  { id:"youssef", name:"يوسف", initial:"ي", preview:"تمام 👍", time:"الإثنين", unread:false, messages:[{from:"them",text:"تمام 👍",time:"الإثنين"}] }
];

const STORAGE_KEY = "nox.messages.preview.v1";
function loadPreviewConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return conversations;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || saved.length > 100) return conversations;
    const valid = saved.every(item =>
      item && typeof item.id === "string" && typeof item.name === "string" &&
      typeof item.initial === "string" && typeof item.preview === "string" &&
      typeof item.time === "string" && typeof item.unread === "boolean" &&
      Array.isArray(item.messages) && item.messages.length <= 500 &&
      item.messages.every(message => message &&
        (message.from === "me" || message.from === "them") &&
        typeof message.text === "string" && message.text.length <= 1000 &&
        typeof message.time === "string" &&
        (message.edited === undefined || typeof message.edited === "boolean") &&
        (message.translatedText === undefined || (typeof message.translatedText === "string" && message.translatedText.length <= 1000)) &&
        (message.translationLanguage === undefined || typeof message.translationLanguage === "string"))
    );
    return valid ? saved : conversations;
  } catch {
    return conversations;
  }
}
function savePreviewConversations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    return true;
  } catch {
    notify("تعذر الحفظ على هذا الجهاز؛ قد تكون مساحة التخزين غير متاحة");
    return false;
  }
}
const restoredConversations = loadPreviewConversations();
conversations.splice(0, conversations.length, ...restoredConversations);

const list = document.getElementById("conversation-list");
const messagesBox = document.getElementById("chat-messages");
const activeName = document.getElementById("active-name");
const activeAvatar = document.getElementById("active-avatar");
const searchInput = document.getElementById("conversation-search");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const toast = document.getElementById("messages-toast");
let activeId = conversations[0].id;
let activeFilter = "all";
let toastTimer;
let typingTimer;
const typingIndicator = document.getElementById("typing-indicator");
const translationLanguage = document.getElementById("translation-language");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function safeText(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}
function renderList() {
  const unreadCount = conversations.filter(item => item.unread).length;
  const unreadSummary = document.getElementById("unread-summary");
  if (unreadSummary) unreadSummary.textContent = unreadCount ? `${unreadCount} محادثات غير مقروءة` : "لا توجد رسائل غير مقروءة";
  const query = searchInput.value.trim().toLocaleLowerCase("ar");
  const visible = conversations.filter(item => {
    const matchesQuery = (item.name + " " + item.preview).toLocaleLowerCase("ar").includes(query);
    return matchesQuery && (activeFilter === "all" || item.unread);
  });
  list.replaceChildren();
  if (!visible.length) {
    list.append(safeText("p","conversation-empty","لا توجد محادثات مطابقة"));
    return;
  }
  visible.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-item" + (item.id === activeId ? " active" : "");
    button.setAttribute("aria-pressed", String(item.id === activeId));
    const avatar = safeText("span","person-avatar",item.initial);
    const copy = document.createElement("span"); copy.className = "conversation-copy";
    copy.append(safeText("strong","",item.name),safeText("span","",item.preview));
    const meta = document.createElement("span"); meta.className = "conversation-meta";
    meta.append(safeText("time","",item.time));
    if(item.unread) meta.append(safeText("i","unread-dot",""));
    button.append(avatar,copy,meta);
    button.addEventListener("click",() => {
      activeId = item.id;
      item.unread = false;
      savePreviewConversations();
      renderList();
      renderChat();
    });
    list.append(button);
  });
}
function renderChat() {
  const item = conversations.find(entry => entry.id === activeId) || conversations[0];
  activeName.textContent = item.name;
  activeAvatar.textContent = item.initial;
  messagesBox.replaceChildren();
  messagesBox.append(safeText("div","message-day","اليوم"));
  item.messages.forEach(message => {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble " + (message.from === "me" ? "sent" : "received");
    bubble.append(safeText("span","message-original",message.text));
    if (message.edited) bubble.append(safeText("small","message-edited","معدّلة"));
    if (message.translatedText) {
      bubble.append(safeText("span","message-translation",message.translatedText));
      bubble.append(safeText("small","translation-caption","ترجمة مضافة يدويًا • " + (message.translationLanguage || "لغة مختارة")));
    }
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.append(safeText("time","message-time",message.time));
    if (message.from === "me") meta.append(safeText("span","message-ticks","✓✓"));
    bubble.append(meta);
    const actions = document.createElement("div");
    actions.className = "message-actions";
    if (message.from === "me") {
      const edit = safeText("button","","تعديل");
      edit.type = "button";
      edit.addEventListener("click",() => {
        const next = window.prompt("عدّل نص الرسالة:",message.text);
        if (next === null) return;
        if (!next.trim() || next.trim().length > 1000) return notify("اكتب رسالة من 1 إلى 1000 حرف");
        message.text = next.trim();
        message.edited = true;
        item.preview = message.text;
        savePreviewConversations();
        renderList();
        renderChat();
        notify("تم تعديل الرسالة في المعاينة المحلية");
      });
      actions.append(edit);
    }
    const translate = safeText("button","","إضافة ترجمة");
    translate.type = "button";
    translate.addEventListener("click",() => {
      const next = window.prompt("أدخل الترجمة يدويًا. الترجمة الآلية لم تُربط بعد:",message.translatedText || "");
      if (next === null) return;
      if (!next.trim() || next.trim().length > 1000) return notify("نص الترجمة يجب أن يكون من 1 إلى 1000 حرف");
      message.translatedText = next.trim();
      message.translationLanguage = translationLanguage.value;
      savePreviewConversations();
      renderChat();
      notify("حُفظت الترجمة اليدوية محليًا");
    });
    actions.append(translate);
    bubble.append(actions);
    messagesBox.append(bubble);
  });
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click",() => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(chip => {
      const active = chip === button;
      chip.classList.toggle("active",active);
      chip.setAttribute("aria-pressed",String(active));
    });
    renderList();
  });
});
searchInput.addEventListener("input",renderList);
input.addEventListener("input",() => {
  typingIndicator.hidden = !input.value.trim();
  clearTimeout(typingTimer);
  if (input.value.trim()) typingTimer = setTimeout(() => { typingIndicator.hidden = true; }, 1800);
});
form.addEventListener("submit",event => {
  event.preventDefault();
  const value = input.value.trim();
  if(!value) return;
  const item = conversations.find(entry => entry.id === activeId);
  const now = new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  item.messages.push({from:"me",text:value,time:now,edited:false});
  item.preview = value;
  item.time = now;
  item.unread = false;
  savePreviewConversations();
  input.value = "";
  typingIndicator.hidden = true;
  clearTimeout(typingTimer);
  renderList();
  renderChat();
  notify("أُضيفت الرسالة للمعاينة المحلية فقط");
});
document.getElementById("new-chat").addEventListener("click",() => notify("بدء محادثة حقيقية يحتاج إلى البحث عن عضو معتمد وربط الخادم"));
document.getElementById("chat-audio").addEventListener("click",() => notify("إعدادات المكالمات جاهزة للمعاينة؛ الاتصال الحقيقي لم يُربط بعد"));
document.getElementById("chat-video").addEventListener("click",() => notify("مكالمات الفيديو الحقيقية تنتظر ربط Agora الآمن"));
document.getElementById("chat-details").addEventListener("click",() => notify("تفاصيل العضو والخصوصية ستُحمّل من الخادم بعد الربط"));
document.getElementById("emoji-toggle").addEventListener("click",() => {
  input.value += " 🙂";
  input.focus();
});
renderList();
renderChat();