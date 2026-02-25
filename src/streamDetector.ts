import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STREAMING_PROCESS_NAMES } from './constants';

const execAsync = promisify(exec);

export class StreamDetector implements vscode.Disposable {
  private _onDidChangeStatus = new vscode.EventEmitter<boolean>();
  readonly onDidChangeStatus = this._onDidChangeStatus.event;

  private _isRunning = false;
  private _pollingTimer: ReturnType<typeof setInterval> | undefined;
  private _disposed = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  startPolling(intervalMs: number): void {
    this.stopPolling();
    this.check();
    this._pollingTimer = setInterval(() => this.check(), intervalMs);
  }

  stopPolling(): void {
    if (this._pollingTimer) {
      clearInterval(this._pollingTimer);
      this._pollingTimer = undefined;
    }
  }

  private async check(): Promise<void> {
    if (this._disposed) {
      return;
    }

    const wasRunning = this._isRunning;
    this._isRunning = await this.isStreamingSoftwareRunning();

    if (wasRunning !== this._isRunning) {
      this._onDidChangeStatus.fire(this._isRunning);
    }
  }

  private async isStreamingSoftwareRunning(): Promise<boolean> {
    const platform = process.platform;
    const processNames = STREAMING_PROCESS_NAMES[platform];

    if (!processNames) {
      return false;
    }

    try {
      if (platform === 'win32') {
        const { stdout } = await execAsync('tasklist /FO CSV /NH');
        const lowerOutput = stdout.toLowerCase();
        return processNames.some((name) => lowerOutput.includes(name.toLowerCase()));
      } else {
        for (const name of processNames) {
          try {
            await execAsync(`pgrep -if "${name}"`);
            return true;
          } catch {
            // pgrep returns exit code 1 if process not found
          }
        }
        return false;
      }
    } catch {
      return false;
    }
  }

  dispose(): void {
    this._disposed = true;
    this.stopPolling();
    this._onDidChangeStatus.dispose();
  }
}
