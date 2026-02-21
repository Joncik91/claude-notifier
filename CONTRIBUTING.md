# Contributing to Claude Notifier

Thanks for your interest in contributing! This is a small project and contributions of all kinds are welcome.

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/claude-notifier.git`
3. Create a branch: `git checkout -b my-change`
4. Make your changes
5. Test with `node test.js` and by triggering actual Claude Code hooks
6. Commit and push
7. Open a pull request

## What to Contribute

- Bug fixes
- New notification platforms (Discord, Slack, email, etc.)
- Better message formatting
- Documentation improvements
- Tests

## Guidelines

- Keep it simple — this project intentionally has zero dependencies (only Node.js built-ins)
- Test your changes with a real Claude Code session before submitting
- One feature per pull request
- Write clear commit messages

## Adding a New Notification Platform

If you want to add support for a platform beyond Telegram:

1. Keep the existing Telegram support working
2. Make the platform configurable via `.env`
3. Follow the same pattern — read stdin JSON, format a message, send it
4. Update the README with setup instructions for the new platform

## Reporting Bugs

Open an issue with:

- What you expected to happen
- What actually happened
- Your Node.js version (`node --version`)
- Your OS

## Questions?

Open an issue — happy to help.
