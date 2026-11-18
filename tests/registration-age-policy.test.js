import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signup = readFileSync(new URL("../signup.html", import.meta.url), "utf8");

test("registration copy states that NOX accounts are available to all ages", () => {
  assert.match(signup, /التسجيل متاح لجميع الأعمار/);
  assert.match(signup, /لا يوجد حد أدنى للعمر لإنشاء حساب NOX/);
});

test("date of birth is optional and is not a registration requirement", () => {
  const match = signup.match(/<input[^>]*id="birth-date"[^>]*>/);
  assert.ok(match, "optional date-of-birth input should be present");
  assert.doesNotMatch(match[0], /\brequired\b/i);
  assert.match(signup, /تاريخ الميلاد اختياري تمامًا/);
  assert.match(signup, /يمكنك ترك هذا الحقل فارغًا/);
});

test("registration page contains no 18+ gate or age rejection copy", () => {
  assert.doesNotMatch(signup, /18\s*\+|18 عامًا|الحد الأدنى للعمر|لا يمكن إكمال التسجيل|رفض التسجيل بسبب العمر/);
});

test("registration does not request identity documents to prove age", () => {
  assert.match(signup, /لا نطلب بطاقة هوية أو مستندًا لإثبات العمر/);
  assert.doesNotMatch(signup, /رفع بطاقة|ارفع الهوية|صورة البطاقة|إثبات العمر مطلوب/);
});

test("privacy, reporting, blocking, and moderation safeguards remain visible", () => {
  assert.match(signup, /الخصوصية/);
  assert.match(signup, /الإبلاغ/);
  assert.match(signup, /الحظر/);
  assert.match(signup, /الإشراف على المحتوى/);
});
