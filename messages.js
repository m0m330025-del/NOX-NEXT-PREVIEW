const conversations = [
  { id:"sara", name:"سارة", initial:"س", preview:"أهلًا! كيف كان يومك؟", time:"10:42", unread:true, messages:[{from:"them",text:"صباح الخير! أخبارك إيه؟",time:"10:38"},{from:"me",text:"الحمد لله، يوم جميل لحد دلوقتي.",time:"10:40"},{from:"them",text:"أهلًا! كيف كان يومك؟",time:"10:42"}] },
  { id:"mariam", name:"مريم", initial:"م", preview:"شكرًا على المساعدة 🌷", time:"أمس", unread:false, messages:[{from:"them",text:"كنت حابة أشكرك على المساعدة 🌷",time:"أمس"}] },
  { id:"ahmed", name:"أحمد", initial:"أ", preview:"نتكلم لاحقًا إن شاء الله", time:"أمس", unread:false, messages:[{from:"me",text:"تمام، نتكلم لاحقًا إن شاء الله.",time:"أمس"}] },
  { id:"layla", name:"ليلى", initial:"ل", preview:"هل وصلتك الصور؟", time:"الثلاثاء", unread:true, messages:[{from:"them",text:"هل وصلتك الصور؟",time:"الثلاثاء"}] },
  { id:"youssef", name:"يوسف", initial:"ي", preview:"تمام 👍", time:"الإثنين", unread:false, messages:[{from:"them",text:"تمام 👍",time:"الإثنين"}] }
];

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
    bubble.append(safeText("span","",message.text),safeText("time","message-time",message.time));
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
form.addEventListener("submit",event => {
  event.preventDefault();
  const value = input.value.trim();
  if(!value) return;
  const item = conversations.find(entry => entry.id === activeId);
  const now = new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  item.messages.push({from:"me",text:value,time:now});
  item.preview = value;
  item.time = now;
  input.value = "";
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