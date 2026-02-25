# ENV Streamer Mode

> Protect your `.env` files while streaming. Automatically detects streaming software and blocks file content until you confirm it's safe to view.

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/goncy.env-streamer-mode)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/goncy.env-streamer-mode)
![License](https://img.shields.io/github/license/goncy/env-streamer-mode-vscode)

## How It Works

1. The extension detects when streaming software is running
2. When you open a `.env` file, instead of showing the content, you see a **protection screen**
3. You must **explicitly confirm** you want to see the file content
4. If no streaming software is detected, `.env` files open normally

No values are ever shown without your consent while streaming.

## Supported Streaming Software

| Software | Windows | macOS | Linux |
|----------|---------|-------|-------|
| OBS Studio | Yes | Yes | Yes |
| Streamlabs Desktop | Yes | Yes | Yes |
| XSplit Broadcaster | Yes | - | - |
| Twitch Studio | Yes | Yes | - |
| vMix | Yes | - | - |
| Wirecast | Yes | Yes | - |

## Features

- **Zero flash** — File content is blocked before it renders, not hidden after
- **Auto-detection** — Polls for streaming software on Windows, macOS, and Linux
- **Manual toggle** — Enable streamer mode from the command palette or status bar when auto-detection doesn't work
- **Session-based** — Manual toggle resets when you restart VS Code
- **Status bar indicator** — Shows whether streamer mode is on or off
- **Smart messaging** — Protection screen shows whether it was triggered by detected software or manual activation

## Commands

| Command | Description |
|---------|-------------|
| `ENV Streamer Mode: Toggle Streamer Mode` | Manually enable/disable for this session |

Access via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) or click the status bar item.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `envStreamerMode.autoDetect` | `true` | Automatically detect streaming software |
| `envStreamerMode.pollInterval` | `5000` | How often to check for streaming software (ms) |

## Protected Files

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.*` (any `.env` variant)

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **"ENV Streamer Mode"**
4. Click **Install**

### From VSIX

```bash
code --install-extension env-streamer-mode-0.1.0.vsix
```

## Development

```bash
npm install
npm run compile
```

Press `F5` to launch the Extension Development Host for testing.

```bash
# Package for publishing
npx vsce package

# Publish
npx vsce publish
```

## License

[MIT](LICENSE)

---

Made by [goncy](https://github.com/goncy)
