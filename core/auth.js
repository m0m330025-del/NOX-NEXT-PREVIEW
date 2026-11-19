import { Client, Account, ID } from "https://cdn.jsdelivr.net/npm/appwrite@17.0.0/+esm";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./appwrite-config.js";
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
export const account = new Account(client);
export { ID };
export async function signIn(email, password) {
  await account.createEmailPasswordSession(email, password);
  return account.get();
}
export async function signUp({ name, email, password, username }) {
  await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  if (username) {
    try { await account.updatePrefs({ username }); }
    catch (error) { console.warn("Optional username preference was not saved:", error); }
  }
  return user;
}
export function authErrorMessage(error, action) {
  const code = Number(error?.code);
  if (code === 409) return "هذا البريد مسجل بالفعل. سجّل الدخول بدلًا من إنشاء حساب جديد.";
  if (code === 401) return "البريد أو كلمة المرور غير صحيحة.";
  if (code === 429) return "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  if (error instanceof TypeError) return "تعذر الاتصال بـ Appwrite. تحقق من الاتصال وإضافة نطاق الموقع ضمن Platforms.";
  return (action === "signup" ? "تعذر إنشاء الحساب" : "تعذر تسجيل الدخول") + (error?.message ? ": " + error.message : ". راجع البيانات وإعدادات Appwrite.");
}
