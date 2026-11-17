// Local preview calculator only; no wallet mutation or server transaction occurs here.
const amount = document.getElementById("amount");
const fromValue = document.getElementById("from-value");
const toValue = document.getElementById("to-value");
const hint = document.getElementById("hint");
const convert = document.getElementById("convert");
function update() {
  const raw = Number(amount.value);
  const valid = Number.isSafeInteger(raw) && raw > 0 && raw % 2 === 0;
  fromValue.textContent = valid ? raw.toLocaleString("en-US") : "0";
  toValue.textContent = valid ? (raw / 2).toLocaleString("en-US") + " NXC" : "0 NXC";
  convert.disabled = !valid;
  hint.textContent = amount.value && !valid
    ? "اكتبي عددًا صحيحًا موجبًا من الجواهر ويكون قابلًا للقسمة على 2."
    : "أدخلي عدد الجواهر لحساب العملات الناتجة. المعاينة لا تخصم أي رصيد.";
}
amount.addEventListener("input", update);
convert.addEventListener("click", () => {
  const toast = document.getElementById("toast");
  toast.textContent = "هذه معاينة حسابية فقط؛ لم يتم تنفيذ تحويل أو تعديل رصيد.";
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
});
update();