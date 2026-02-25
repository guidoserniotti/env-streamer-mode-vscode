# ENV Streamer Mode

> Protect your `.env` files while streaming. Detects OBS Studio and blocks `.env` file content until you confirm it's safe to view.

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/goncy.env-streamer-mode)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/goncy.env-streamer-mode)
![License](https://img.shields.io/github/license/goncy/env-streamer-mode-vscode)

## How It Works

1. The extension detects when **OBS Studio** is running
2. When you open a `.env` file, instead of showing the content, you see a **protection screen**
3. You must **explicitly confirm** you want to see the file content
4. If OBS is not running, `.env` files open normally

No values are ever shown without your consent while streaming.

## Features

- **Zero flash** — File content is blocked before it renders, not hidden after
- **OBS auto-detection** — Polls for OBS Studio process on Windows, macOS, and Linux
- **Manual toggle** — Enable streamer mode from the command palette even without OBS
- **Session-based** — Manual toggle resets when you restart VS Code
- **Status bar indicator** — Always know if streamer mode is active

## Commands

| Command | Description |
|---------|-------------|
| `ENV Streamer Mode: Toggle Streamer Mode` | Manually enable/disable streamer mode for this session |

Access via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `envStreamerMode.autoDetectOBS` | `true` | Automatically detect OBS Studio |
| `envStreamerMode.pollInterval` | `5000` | How often to check for OBS (ms) |

## Protected Files

The extension protects all files matching:

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

## License

[MIT](LICENSE)
