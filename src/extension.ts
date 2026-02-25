import * as vscode from 'vscode';
import { OBSDetector } from './obsDetector';
import { ProtectedEditorProvider } from './protectedEditorProvider';
import { COMMANDS, EXTENSION_ID, CONFIG_KEYS, VIEW_TYPES } from './constants';

let obsDetector: OBSDetector;
let statusBarItem: vscode.StatusBarItem;

// Session-based override (resets on VS Code restart)
// null = auto (OBS-driven), true = forced on, false = forced off
let manualOverride: boolean | null = null;

function isStreamerModeActive(): boolean {
  if (manualOverride !== null) {
    return manualOverride;
  }
  return obsDetector.isRunning;
}

function updateStatusBar(): void {
  if (isStreamerModeActive()) {
    statusBarItem.text = '$(broadcast) Streamer Mode: On';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = 'ENV Streamer Mode is active. .env files are protected.';
  } else {
    statusBarItem.text = '$(circle-slash) Streamer Mode: Off';
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip = 'ENV Streamer Mode is inactive.';
  }
}

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration(EXTENSION_ID);

  // OBS detector
  obsDetector = new OBSDetector();
  context.subscriptions.push(obsDetector);

  // Status bar (display only, no click action)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Custom editor — intercepts .env file opening before content renders
  const protectedEditor = new ProtectedEditorProvider(() => isStreamerModeActive());
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      VIEW_TYPES.PROTECTED_EDITOR,
      protectedEditor,
      { supportsMultipleEditorsPerDocument: false },
    ),
  );

  // Update status bar when OBS status changes
  context.subscriptions.push(
    obsDetector.onDidChangeStatus(() => updateStatusBar()),
  );

  // Start OBS polling
  if (config.get<boolean>(CONFIG_KEYS.AUTO_DETECT_OBS, true)) {
    const pollInterval = config.get<number>(CONFIG_KEYS.POLL_INTERVAL, 5000);
    obsDetector.startPolling(pollInterval);
  }

  // Toggle command (only way to manually enable/disable, session-based)
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.TOGGLE, () => {
      if (manualOverride === true) {
        manualOverride = null; // back to auto
        vscode.window.showInformationMessage('ENV Streamer Mode: Back to automatic (OBS detection).');
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
      if (newConfig.get<boolean>(CONFIG_KEYS.AUTO_DETECT_OBS, true)) {
        const interval = newConfig.get<number>(CONFIG_KEYS.POLL_INTERVAL, 5000);
        obsDetector.startPolling(interval);
      } else {
        obsDetector.stopPolling();
      }
    }),
  );

  updateStatusBar();
}

export function deactivate() {}
