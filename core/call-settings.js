const STORAGE_KEY = "nox.call.settings.v1";
const DEFAULTS = {
  micEnabled: true, echoCancellation: true, noiseSuppression: true, autoGainControl: true,
  audioInput: "", audioOutput: "", cameraAuto: false, cameraMirror: true, videoQuality: "auto",
  ringtone: "classic", vibration: true, privacy: "friends", availability: true
};
const FIELD_MAP = {
  "call-mic-enabled":"micEnabled", "call-echo-cancel":"echoCancellation",
  "call-noise-suppression":"noiseSuppression", "call-auto-gain":"autoGainControl",
  "call-audio-input":"audioInput", "call-audio-output":"audioOutput",
  "call-camera-auto":"cameraAuto", "call-camera-mirror":"cameraMirror",
  "call-video-quality":"videoQuality", "call-ringtone":"ringtone",
  "call-vibration":"vibration", "call-privacy":"privacy", "call-availability":"availability"
};

export function initCallSettings() {
  const modal = document.getElementById("call-settings-modal");
  if (!modal) return;
  const status = document.getElementById("call-audio-status");
  const saveStatus = document.getElementById("call-settings-save-status");
  const inputSelect = document.getElementById("call-audio-input");
  const outputSelect = document.getElementById("call-audio-output");
  const micTest = document.getElementById("call-test-mic");
  let micStream = null, audioContext = null, analyserFrame = 0, testOscillators = [], toneTimeout = 0;
  let returnFocus = null;

  function readSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULTS, ...parsed };
    } catch { return { ...DEFAULTS }; }
  }
  function collectSettings() {
    const result = {};
    for (const [id,key] of Object.entries(FIELD_MAP)) {
      const field = document.getElementById(id);
      if (field) result[key] = field.type === "checkbox" ? field.checked : field.value;
    }
    return result;
  }
  function applySettings(settings) {
    for (const [id,key] of Object.entries(FIELD_MAP)) {
      const field = document.getElementById(id);
      if (!field) continue;
      if (field.type === "checkbox") field.checked = Boolean(settings[key]);
      else if (settings[key] !== undefined) field.value = settings[key];
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectSettings()));
      saveStatus.textContent = "تم حفظ الإعدادات على هذا الجهاز";
    } catch {
      saveStatus.textContent = "تعذر الحفظ في المتصفح؛ تحقق من مساحة التخزين";
    }
  }
  function stopMicTest() {
    if (analyserFrame) cancelAnimationFrame(analyserFrame);
    analyserFrame = 0;
    if (micStream) micStream.getTracks().forEach(track => track.stop());
    micStream = null;
    if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => {});
    audioContext = null;
    micTest.textContent = "اختبار الميكروفون";
    status.textContent = "اختبار الميكروفون متوقف";
  }
  function stopSoundTest() {
    if (toneTimeout) window.clearTimeout(toneTimeout);
    toneTimeout = 0;
    testOscillators.forEach(node => { try { node.stop(); } catch {} });
    testOscillators = [];
    if (audioContext && !micStream && audioContext.state !== "closed") audioContext.close().catch(() => {});
    if (!micStream) audioContext = null;
  }
  function stopAllTests() { stopMicTest(); stopSoundTest(); }

  async function refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      status.textContent = "المتصفح لا يدعم اكتشاف أجهزة الصوت";
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const selectedInput = inputSelect.value, selectedOutput = outputSelect.value;
      const fill = (select, kind, selected, defaultLabel) => {
        select.replaceChildren(new Option(defaultLabel, ""));
        devices.filter(device => device.kind === kind).forEach((device,index) => {
          const option = new Option(device.label || `${kind === "audioinput" ? "ميكروفون" : "سماعة"} ${index+1}`, device.deviceId);
          select.add(option);
        });
        if ([...select.options].some(option => option.value === selected)) select.value = selected;
      };
      fill(inputSelect,"audioinput",selectedInput,"الميكروفون الافتراضي");
      fill(outputSelect,"audiooutput",selectedOutput,"مخرج الصوت الافتراضي");
      status.textContent = "تم تحديث قائمة الأجهزة المتاحة";
    } catch { status.textContent = "تعذر قراءة قائمة الأجهزة من المتصفح"; }
  }

  async function startMicTest() {
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = "اختبار الميكروفون غير مدعوم في هذا المتصفح أو يحتاج HTTPS";
      return;
    }
    micTest.disabled = true;
    status.textContent = "بانتظار إذن الميكروفون…";
    try {
      const settings = collectSettings();
      const audio = {
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl
      };
      if (settings.audioInput) audio.deviceId = { exact: settings.audioInput };
      micStream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(micStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      micTest.textContent = "إيقاف اختبار الميكروفون";
      status.textContent = "الميكروفون يعمل — تحدث لرؤية مستوى الصوت";
      const draw = () => {
        if (!analyser || !micStream) return;
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) energy += Math.abs(sample - 128);
        const level = Math.min(100, Math.round(energy / samples.length * 3));
        status.textContent = `الميكروفون يعمل — مستوى الإشارة ${level}%`;
        analyserFrame = requestAnimationFrame(draw);
      };
      draw();
    } catch (error) {
      status.textContent = error?.name === "NotAllowedError" ? "لم تسمح باستخدام الميكروفون" : "تعذر تشغيل الميكروفون؛ تحقق من الجهاز والإذن";
      stopMicTest();
    } finally { micTest.disabled = false; }
  }

  async function playTone(pattern = "speaker") {
    if (micStream) stopMicTest();
    stopSoundTest();
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") await audioContext.resume();
      if (pattern === "speaker" && outputSelect.value && typeof audioContext.setSinkId === "function") {
        await audioContext.setSinkId(outputSelect.value);
      }
      const sequences = pattern === "ring"
        ? (collectSettings().ringtone === "soft" ? [[660,.16],[880,.22]] : [[740,.14],[988,.14],[740,.14]])
        : [[660,.35]];
      let offset = audioContext.currentTime;
      for (const [frequency,duration] of sequences) {
        if (pattern === "ring" && collectSettings().ringtone === "silent") break;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(.0001,offset);
        gain.gain.exponentialRampToValueAtTime(.12,offset+.025);
        gain.gain.exponentialRampToValueAtTime(.0001,offset+duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(offset);
        oscillator.stop(offset+duration+.02);
        testOscillators.push(oscillator);
        offset += duration + .08;
      }
      status.textContent = pattern === "ring" ? "معاينة نغمة الرنين" : "اختبار السماعة";
      toneTimeout = window.setTimeout(() => {
        stopSoundTest();
        if (!micStream) status.textContent = "انتهى اختبار الصوت";
      }, pattern === "ring" ? 900 : 500);
    } catch {
      status.textContent = "تعذر تشغيل الصوت التجريبي في هذا المتصفح";
      stopSoundTest();
    }
  }

  function open() {
    returnFocus = document.activeElement;
    applySettings(readSettings());
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    modal.querySelector(".call-settings-close")?.focus();
    refreshDevices();
  }
  function close() {
    stopAllTests();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }

  document.querySelectorAll('[data-action="open-call-settings"]').forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    open();
  }));
  modal.querySelectorAll("[data-call-settings-close]").forEach(button => button.addEventListener("click",close));
  document.getElementById("call-settings-save").addEventListener("click",save);
  document.getElementById("call-settings-reset").addEventListener("click",() => {
    applySettings(DEFAULTS);
    save();
    status.textContent = "تمت استعادة الإعدادات الافتراضية";
  });
  document.getElementById("call-refresh-devices").addEventListener("click",refreshDevices);
  micTest.addEventListener("click",() => micStream ? stopMicTest() : startMicTest());
  document.getElementById("call-test-speaker").addEventListener("click",() => playTone("speaker"));
  document.getElementById("call-preview-ringtone").addEventListener("click",() => playTone("ring"));
  document.getElementById("call-open-camera-test").addEventListener("click",() => {
    close();
    document.querySelector('[data-action="open-camera-studio"][data-camera-mode="call"]')?.click();
  });
  for (const id of ["call-audio-input","call-audio-output"]) {
    document.getElementById(id).addEventListener("change",() => saveStatus.textContent = "تغيير غير محفوظ");
  }
  modal.addEventListener("keydown",event => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const items = [...modal.querySelectorAll('button:not([disabled]),select,input')].filter(item => item.getClientRects().length);
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
  });
  window.addEventListener("pagehide",stopAllTests);
  refreshDevices();
}
