import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("signup creates an Appwrite account, immediately opens a session, then reads the user", () => {
  const auth = read("core/auth.js");
  assert.match(auth, /account\.create\(ID\.unique\(\), email, password, name\)/);
  assert.match(auth, /account\.createEmailPasswordSession\(email, password\)/);
  assert.match(auth, /return account\.get\(\)/);
});

test("login is connected to real Appwrite authentication", () => {
  const html = read("login.html");
  assert.match(html, /import \{ signIn, authErrorMessage \} from "\.\/core\/auth\.js"/);
  assert.match(html, /await signIn\(email, value\)/);
  assert.doesNotMatch(html, /دخول للمعاينة|دخول تجريبي/);
});

test("signup is connected to real Appwrite authentication without age gating", () => {
  const html = read("signup.html");
  assert.match(html, /import \{ signUp, authErrorMessage \} from "\.\/core\/auth\.js"/);
  assert.match(html, /await signUp\(\{name,username,email,password\}\)/);
  assert.doesNotMatch(html, /18\s*\+|18 عامًا|13\s*إلى\s*120/);
});

test("protected home requires a valid session and supports logout", () => {
  const session = read("core/session.js");
  const app = read("app.js");
  const home = read("home.html");
  assert.match(session, /await account\.get\(\)/);
  assert.match(session, /account\.deleteSession\("current"\)/);
  assert.match(app, /if \(!\(await initAuthSession\(\)\)\) return/);
  assert.match(home, /data-action="logout"/);
});

test("Preview uses the approved NOX NEXT CORE project", () => {
  const config = read("core/appwrite-config.js");
  assert.match(config, /https:\/\/fra\.cloud\.appwrite\.io\/v1/);
  assert.match(config, /6af9ca51000735dfb692/);
});
