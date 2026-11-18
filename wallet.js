// Preview-only behavior. No wallet API is connected and no transaction is sent.
const recipient = document.getElementById("recipient");
const amount = document.getElementById("amount");
const review = document.getElementById("review");
const notice = document.getElementById("notice");
const recipientState = document.getElementById("recipient-state");
review.addEventListener("click", () => {
  const id = recipient.value.trim();
  const value = Number(amount.value);
  if (!id || !Number.isSafeInteger(value) || value <= 0) {
    notice.textContent = "أدخل NOX ID ومبلغًا صحيحًا من الأعداد الصحيحة لمعاينة الخطوات.";
    return;
  }
  recipientState.textContent = "اسم المستلم غير متاح في المعاينة؛ يجب أن يتحقق الخادم من NOX ID قبل التأكيد.";
  notice.textContent = "لم يتم تنفيذ تحويل. في النسخة المتصلة سيظهر اسم المستلم أولًا، ثم شاشة تأكيد نهائية.";
});
