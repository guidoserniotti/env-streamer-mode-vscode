import * as vscode from 'vscode';
import { StreamDetector } from './streamDetector';
import { ProtectedEditorProvider } from './protectedEditorProvider';
import { COMMANDS, EXTENSION_ID, CONFIG_KEYS, VIEW_TYPES } from './constants';

let streamDetector: StreamDetector;
let statusBarItem: vscode.StatusBarItem;

// Session-based manual override (resets on VS Code restart)
let manualOverride: boolean | null = null;

function isStreamerModeActive(): boolean {
  if (manualOverride !== null) {
    return manualOverride;
  }
  return streamDetector.isRunning;
}

function getActiveReason(): string {
  if (manualOverride === true && !streamDetector.isRunning) {
    return 'Streamer mode was manually enabled';
  }
  return 'Streaming software detected';
}

function updateStatusBar(): void {
  if (isStreamerModeActive()) {
    statusBarItem.text = '$(broadcast) Streamer Mode: On';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = getActiveReason() + '. .env files are protected.';
  } else {
    statusBarItem.text = '$(circle-slash) Streamer Mode: Off';
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip = 'No streaming software detected.';
  }
}

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration(EXTENSION_ID);

  streamDetector = new StreamDetector();
  context.subscriptions.push(streamDetector);

  // Status bar indicator
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = COMMANDS.TOGGLE;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Custom editor — intercepts .env file opening before content renders
  const protectedEditor = new ProtectedEditorProvider(() => ({
    active: isStreamerModeActive(),
    reason: getActiveReason(),
  }));
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      VIEW_TYPES.PROTECTED_EDITOR,
      protectedEditor,
      { supportsMultipleEditorsPerDocument: false },
    ),
  );

  // Update status bar when streaming software status changes
  context.subscriptions.push(
    streamDetector.onDidChangeStatus(() => updateStatusBar()),
  );

  // Start polling
  if (config.get<boolean>(CONFIG_KEYS.AUTO_DETECT, true)) {
    const pollInterval = config.get<number>(CONFIG_KEYS.POLL_INTERVAL, 5000);
    streamDetector.startPolling(pollInterval);
  }

  // Toggle command — for manual enable/disable when auto-detection doesn't work
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.TOGGLE, () => {
      if (manualOverride === true) {
        manualOverride = null;
        vscode.window.showInformationMessage('ENV Streamer Mode: Back to automatic detection.');
      } else {
        manualOverride = true;
        vscode.window.showInformationMessage('ENV Streamer Mode: Manually enabled for this session.');
      }
      updateStatusBar();
    }),
  );

  // React to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration(EXTENSION_ID)) {
        return;
      }
      const newConfig = vscode.workspace.getConfiguration(EXTENSION_ID);
      if (newConfig.get<boolean>(CONFIG_KEYS.AUTO_DETECT, true)) {
        const interval = newConfig.get<number>(CONFIG_KEYS.POLL_INTERVAL, 5000);
        streamDetector.startPolling(interval);
      } else {
        streamDetector.stopPolling();
      }
    }),
  );

  updateStatusBar();
}

export function deactivate() {}
