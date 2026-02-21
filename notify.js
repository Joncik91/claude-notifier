const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load .env from same directory as this script
const envPath = path.join(__dirname, ".env");
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
      if (match) env[match[1]] = match[2];
    });
}

const BOT_TOKEN = env.BOT_TOKEN;
const CHAT_ID = env.CHAT_ID;

// Deduplication: prevent sending the same notification repeatedly
const STATE_FILE = path.join(__dirname, ".notify-state.json");
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes — won't re-send identical notification within this window

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {
    // Non-critical — worst case we send a duplicate
  }
}

function isDuplicate(fingerprint) {
  const state = loadState();
  if (state.lastHash === fingerprint && state.lastSentAt) {
    const elapsed = Date.now() - state.lastSentAt;
    if (elapsed < COOLDOWN_MS) return true;
  }
  return false;
}

function recordSent(fingerprint) {
  saveState({ lastHash: fingerprint, lastSentAt: Date.now() });
}

if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN === "your_bot_token_here") {
  process.exit(0); // Silently exit if not configured
}

function sendTelegram(text) {
  const payload = JSON.stringify({
    chat_id: CHAT_ID,
    text,
    parse_mode: "HTML",
  });

  const req = https.request(
    {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    (res) => {
      res.resume(); // Drain response
      if (res.statusCode !== 200) {
        process.exit(1);
      }
    }
  );

  req.on("error", () => process.exit(1));
  req.write(payload);
  req.end();
}

function truncate(str, max = 500) {
  if (!str) return "";
  str = str.trim();
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Read JSON from stdin (Claude Code hooks pipe event data here)
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0); // Not valid JSON, ignore
  }

  const event = data.hook_event_name;

  if (event === "Stop") {
    const msg = data.last_assistant_message || "";
    const preview = truncate(escapeHtml(msg), 400);
    const text =
      `<b>✅ Claude Code — Task Complete</b>\n\n` +
      (preview ? `<pre>${preview}</pre>` : "<i>No message content</i>");

    const fingerprint = crypto
      .createHash("md5")
      .update("stop:" + msg.slice(0, 200))
      .digest("hex");
    if (isDuplicate(fingerprint)) process.exit(0);
    recordSent(fingerprint);
    sendTelegram(text);
  } else if (event === "Notification") {
    const title = data.title || "";
    const message = data.message || "";

    // Deduplicate: hash the title+message and skip if recently sent
    const fingerprint = crypto
      .createHash("md5")
      .update(title + "|" + message)
      .digest("hex");
    if (isDuplicate(fingerprint)) process.exit(0);

    const text =
      `<b>❓ Claude Code — Needs Attention</b>\n\n` +
      (title ? `<b>${escapeHtml(title)}</b>\n` : "") +
      escapeHtml(truncate(message, 500));
    recordSent(fingerprint);
    sendTelegram(text);
  } else {
    process.exit(0); // Unknown event, ignore
  }
});
