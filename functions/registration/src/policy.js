export function normalizeRegistrationInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!displayName || displayName.length > 80) return null;
  if (password.length < 8 || password.length > 256) return null;
  return { email, displayName, password };
}

export function hasApprovedRegistrationProfile(profile) {
  return Boolean(
    profile &&
    typeof profile === "object" &&
    profile.accountStatus === "APPROVED" &&
    typeof profile.authUserId === "string" &&
    typeof profile.noxId === "string" &&
    typeof profile.displayName === "string"
  );
}
