const https = require("https");
const fs = require("fs");
const path = require("path");

// Load .env
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

if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN === "your_bot_token_here") {
  console.error("ERROR: Edit .env file with your BOT_TOKEN and CHAT_ID first.");
  console.error("  File: " + envPath);
  process.exit(1);
}

const payload = JSON.stringify({
  chat_id: CHAT_ID,
  text: "<b>🔔 Claude Notifier — Test</b>\n\nIf you see this, your Telegram bot is configured correctly!",
  parse_mode: "HTML",
});

console.log("Sending test message to Telegram...");

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
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("SUCCESS! Check your Telegram.");
      } else {
        console.error("FAILED (HTTP " + res.statusCode + "):");
        try {
          const parsed = JSON.parse(body);
          console.error("  " + parsed.description);
        } catch {
          console.error("  " + body);
        }
      }
    });
  }
);

req.on("error", (err) => {
  console.error("Network error:", err.message);
});

req.write(payload);
req.end();
