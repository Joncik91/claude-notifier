# Claude Notifier

Get Telegram notifications when [Claude Code](https://docs.anthropic.com/en/docs/claude-code) needs your attention or finishes a task.

Stop babysitting your terminal — let Claude ping you on Telegram when it needs permission, has a question, or completes work.

## Notifications

| Event | Example |
|---|---|
| **Task Complete** | `Claude Code — Task Complete` with a preview of the last message |
| **Needs Attention** | `Claude Code — Needs Attention` when Claude needs permission, has a question, or hits an error |

Built-in deduplication prevents notification spam — identical events are suppressed for 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- Your Telegram chat ID (from [@userinfobot](https://t.me/userinfobot))

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/Joncik91/claude-notifier.git
cd claude-notifier
```

### 2. Configure your Telegram bot

```bash
cp .env-example .env
```

Edit `.env` with your bot token and chat ID:

```
BOT_TOKEN=123456789:ABCdefGhIjKlMnOpQrStUvWxYz
CHAT_ID=987654321
```

### 3. Test the connection

```bash
node test.js
```

You should receive a test message in Telegram.

### 4. Register the hooks with Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/claude-notifier/notify.js\"",
            "timeout": 10
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/claude-notifier/notify.js\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Replace `/path/to/claude-notifier` with the actual path where you cloned the repo.

That's it. Start a Claude Code session and you'll get notified on Telegram.

## How It Works

Claude Code supports [hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) — shell commands that run in response to events. This project registers hooks for two events:

- **Stop** — fires when Claude finishes a task
- **Notification** — fires when Claude needs attention (permission prompts, questions, errors)

Each hook invocation pipes JSON event data via stdin to `notify.js`, which formats it and sends a Telegram message via the Bot API.

A state file (`.notify-state.json`) tracks the last sent notification to prevent duplicates — if the same notification fires again within 5 minutes, it's silently skipped.

## Configuration

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `CHAT_ID` | Your Telegram chat ID from [@userinfobot](https://t.me/userinfobot) |

The cooldown for duplicate notifications defaults to 5 minutes. To change it, edit `COOLDOWN_MS` in `notify.js`.

## License

[MIT](LICENSE)
