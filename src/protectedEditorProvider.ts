import * as vscode from "vscode";

interface StreamerModeState {
  active: boolean;
  reason: string;
}

export class ProtectedEditorProvider
  implements vscode.CustomReadonlyEditorProvider
{
  private _getState: () => StreamerModeState;

  constructor(getState: () => StreamerModeState) {
    this._getState = getState;
  }

  openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: () => {} };
  }

  resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void {
    const state = this._getState();

    if (!state.active) {
      webviewPanel.webview.html = getBlankHtml();
      setTimeout(async () => {
        const viewColumn = webviewPanel.viewColumn;
        webviewPanel.dispose();
        const doc = await vscode.workspace.openTextDocument(document.uri);
        await vscode.window.showTextDocument(doc, { viewColumn });
      }, 0);
      return;
    }

    webviewPanel.webview.options = { enableScripts: true };
    let mode: "protection" | "lines" = "protection";
    let lines: string[] = [];

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      const viewColumn = webviewPanel.viewColumn;

      if (message.command === "open") {
        webviewPanel.dispose();
        const doc = await vscode.workspace.openTextDocument(document.uri);
        await vscode.window.showTextDocument(doc, { viewColumn });
      } else if (message.command === "close") {
        webviewPanel.dispose();
      } else if (message.command === "reviewLines" && mode === "protection") {
        try {
          const textDocument = await vscode.workspace.openTextDocument(
            document.uri,
          );
          const text = textDocument.getText();
          lines = text.length === 0 ? [] : text.split(/\r\n|\n|\r/);
          mode = "lines";
          webviewPanel.webview.html = getLineReviewHtml(
            lines.map(getLineLabel),
          );
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(
            `ENV Streamer Mode: Could not read this file. ${detail}`,
          );
        }
      } else if (message.command === "back" && mode === "lines") {
        mode = "protection";
        webviewPanel.webview.html = getProtectionHtml(
          webviewPanel.webview,
          state.reason,
        );
      } else if (message.command === "setLineVisibility" && mode === "lines") {
        const line = message.line;
        if (
          typeof line !== "number" ||
          !Number.isInteger(line) ||
          line < 0 ||
          line >= lines.length
        ) {
          return;
        }
        if (message.visible === true) {
          void webviewPanel.webview.postMessage({
            command: "lineState",
            line,
            visible: true,
            text: lines[line],
          });
        } else if (message.visible === false) {
          void webviewPanel.webview.postMessage({
            command: "lineState",
            line,
            visible: false,
          });
        }
      }
    });

    webviewPanel.webview.html = getProtectionHtml(
      webviewPanel.webview,
      state.reason,
    );
  }
}

function getBlankHtml(): string {
  return '<!DOCTYPE html><html><body style="background:var(--vscode-editor-background)"></body></html>';
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getLineLabel(line: string): string {
  const assignment = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=/.exec(
    line,
  );
  if (assignment) {
    return assignment[1];
  }
  if (line.trim().length === 0) {
    return "Empty line";
  }
  if (line.trimStart().startsWith("#")) {
    return "Comment";
  }
  return "Unrecognized line";
}

function getProtectionHtml(webview: vscode.Webview, reason: string): string {
  const nonce = getNonce();
  const escapedReason = reason
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 2rem;
    }
    .shield {
      font-size: 56px;
      margin-bottom: 20px;
      line-height: 1;
    }
    h2 {
      font-size: 1.5em;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .warning {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--vscode-inputValidation-warningBackground);
      border: 1px solid var(--vscode-inputValidation-warningBorder, #f0c000);
      border-radius: 4px;
      padding: 8px 16px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    p {
      color: var(--vscode-descriptionForeground);
      line-height: 1.6;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    button {
      padding: 10px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      min-width: 280px;
      transition: opacity 0.1s;
    }
    button:hover { opacity: 0.9; }
    button:active { opacity: 0.8; }
    .primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="shield">\u{1F6E1}\u{FE0F}</div>
    <h2>Streamer Mode Active</h2>
    <div class="warning">\u{26A0}\u{FE0F} ${escapedReason}</div>
    <p>
      This file contains environment variables with sensitive values.<br>
      Are you sure you want to open it? Your stream audience may see its content.
    </p>
    <div class="buttons">
      <button class="primary" id="open">Show file content</button>
      <button class="secondary" id="review">Review lines individually</button>
      <button class="secondary" id="close">Close file</button>
    </div>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('open').addEventListener('click', () => {
      vscode.postMessage({ command: 'open' });
    });
    document.getElementById('close').addEventListener('click', () => {
      vscode.postMessage({ command: 'close' });
    });
    document.getElementById('review').addEventListener('click', () => {
      vscode.postMessage({ command: 'reviewLines' });
    });
  </script>
</body>
</html>`;
}

function getLineReviewHtml(lineLabels: string[]): string {
  const nonce = getNonce();
  const serializedLineLabels = JSON.stringify(lineLabels);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: var(--vscode-editor-background);
      border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-editorWidget-border));
    }
    h2 { margin: 0 0 4px; font-size: 1.2em; }
    header p { margin: 0; color: var(--vscode-descriptionForeground); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button {
      padding: 6px 12px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border: 0;
      border-radius: 2px;
      cursor: pointer;
      font: inherit;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    main { padding: 12px 24px 24px; }
    .line {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      min-height: 34px;
      border-bottom: 1px solid var(--vscode-editorWidget-border);
    }
    .number {
      color: var(--vscode-editorLineNumber-foreground);
      text-align: right;
      user-select: none;
    }
    code {
      display: block;
      min-width: 0;
      overflow-x: auto;
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-editor-font-family);
      white-space: pre;
    }
    .line button { min-width: 64px; }
    .empty { padding: 20px 0; color: var(--vscode-descriptionForeground); }
    @media (max-width: 650px) {
      header { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h2>Review .env lines</h2>
      <p>Variable names are shown, but values stay hidden until you reveal a line.</p>
    </div>
    <div class="actions">
      <button id="back">Back to protection screen</button>
      <button id="open">Show entire file</button>
      <button id="close">Close file</button>
    </div>
  </header>
  <main id="lines" aria-label="File lines"></main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const lineLabels = ${serializedLineLabels};
    const lineCount = lineLabels.length;
    const container = document.getElementById('lines');
    const entries = [];

    for (let index = 0; index < lineCount; index++) {
      const row = document.createElement('div');
      row.className = 'line';

      const number = document.createElement('span');
      number.className = 'number';
      number.textContent = String(index + 1);

      const content = document.createElement('code');
      content.textContent = lineLabels[index];

      const button = document.createElement('button');
      button.textContent = 'Show';
      button.setAttribute('aria-label', 'Show line ' + (index + 1));
      button.addEventListener('click', () => {
        vscode.postMessage({
          command: 'setLineVisibility',
          line: index,
          visible: !entries[index].visible,
        });
      });

      row.append(number, content, button);
      container.appendChild(row);
      entries.push({ content, button, lineNumber: index + 1, visible: false });
    }

    if (lineCount === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'This file is empty.';
      container.appendChild(empty);
    }

    document.getElementById('back').addEventListener('click', () => {
      vscode.postMessage({ command: 'back' });
    });
    document.getElementById('open').addEventListener('click', () => {
      vscode.postMessage({ command: 'open' });
    });
    document.getElementById('close').addEventListener('click', () => {
      vscode.postMessage({ command: 'close' });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command !== 'lineState' || !Number.isInteger(message.line)) {
        return;
      }

      const entry = entries[message.line];
      if (!entry) {
        return;
      }

      if (message.visible) {
        entry.content.textContent = message.text;
        entry.button.textContent = 'Hide';
        entry.button.setAttribute('aria-label', 'Hide line ' + entry.lineNumber);
        entry.visible = true;
      } else {
        entry.content.textContent = 'Hidden';
        entry.button.textContent = 'Show';
        entry.button.setAttribute('aria-label', 'Show line ' + entry.lineNumber);
        entry.visible = false;
      }
    });
  </script>
</body>
</html>`;
}
