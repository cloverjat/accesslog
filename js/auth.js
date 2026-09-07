const STORAGE_USERS = "accesslog_users";
const STORAGE_LOGS = "accesslog_logs";
const STORAGE_SESSION = "accesslog_session";
const STORAGE_RESETS = "accesslog_resets";

const SEED_ADMIN = {
  id: "u_admin",
  name: "Admin",
  email: "admin@accesslog.app",
  passwordHash: null,
  role: "admin",
  createdAt: new Date().toISOString()
};

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}
function loadLogs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LOGS) || "[]"); }
  catch { return []; }
}
function saveLogs(logs) {
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs.slice(0, 400)));
}
function loadResets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_RESETS) || "{}"); }
  catch { return {}; }
}
function saveResets(map) {
  localStorage.setItem(STORAGE_RESETS, JSON.stringify(map));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); }
  catch { return null; }
}
function setSession(user) {
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    at: Date.now()
  };
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  return session;
}
function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
}

async function ensureSeed() {
  const users = loadUsers();
  if (!users.some(u => u.email === SEED_ADMIN.email)) {
    const admin = { ...SEED_ADMIN, passwordHash: await sha256("Admin123!") };
    users.unshift(admin);
    saveUsers(users);
  }
}

async function lookupGeo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("geo fail");
    const d = await res.json();
    return {
      ip: d.ip || "unknown",
      city: d.city || "Unknown",
      region: d.region || "",
      country: d.country_name || "Unknown",
      isp: d.org || ""
    };
  } catch {
    return { ip: "unavailable", city: "Unknown", region: "", country: "Unknown", isp: "" };
  }
}

function addLog(entry) {
  const logs = loadLogs();
  logs.unshift({
    id: "l_" + Math.random().toString(36).slice(2, 10),
    ts: new Date().toISOString(),
    ...entry
  });
  saveLogs(logs);
}

function showAlert(el, type, msg) {
  if (!el) return;
  el.className = "alert show " + type;
  el.textContent = msg;
}

function requireAuth(role) {
  const s = getSession();
  if (!s) {
    location.href = "index.html";
    return null;
  }
  if (role && s.role !== role) {
    location.href = "dashboard.html";
    return null;
  }
  return s;
}

function fmt(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

ensureSeed();
