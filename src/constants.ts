export const EXTENSION_ID = 'envStreamerMode';

export const COMMANDS = {
  TOGGLE: 'envStreamerMode.toggle',
} as const;

export const VIEW_TYPES = {
  PROTECTED_EDITOR: 'envStreamerMode.protectedEditor',
} as const;

export const CONFIG_KEYS = {
  AUTO_DETECT_OBS: 'autoDetectOBS',
  POLL_INTERVAL: 'pollInterval',
} as const;

export const OBS_PROCESS_NAMES: Record<string, string[]> = {
  win32: ['obs64.exe', 'obs32.exe', 'obs.exe'],
  darwin: ['obs', 'OBS'],
  linux: ['obs'],
};
