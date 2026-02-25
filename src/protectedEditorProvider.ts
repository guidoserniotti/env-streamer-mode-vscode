import * as vscode from 'vscode';

interface StreamerModeState {
  active: boolean;
  reason: string;
}

export class ProtectedEditorProvider implements vscode.CustomReadonlyEditorProvider {
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
    webviewPanel.webview.html = getProtectionHtml(webviewPanel.webview, state.reason);

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      const viewColumn = webviewPanel.viewColumn;

      if (message.command === 'open') {
        webviewPanel.dispose();
        const doc = await vscode.workspace.openTextDocument(document.uri);
        await vscode.window.showTextDocument(doc, { viewColumn });
      } else if (message.command === 'close') {
        webviewPanel.dispose();
      }
    });
  }
}

function getBlankHtml(): string {
  return '<!DOCTYPE html><html><body style="background:var(--vscode-editor-background)"></body></html>';
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getProtectionHtml(webview: vscode.Webview, reason: string): string {
  const nonce = getNonce();
  const escapedReason = reason.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  </script>
</body>
</html>`;
}
