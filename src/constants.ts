export const EXTENSION_ID = 'envStreamerMode';

export const COMMANDS = {
  TOGGLE: 'envStreamerMode.toggle',
} as const;

export const VIEW_TYPES = {
  PROTECTED_EDITOR: 'envStreamerMode.protectedEditor',
} as const;

export const CONFIG_KEYS = {
  AUTO_DETECT: 'autoDetect',
  POLL_INTERVAL: 'pollInterval',
} as const;

// Process names for popular streaming/broadcasting software per platform
export const STREAMING_PROCESS_NAMES: Record<string, string[]> = {
  win32: [
    // OBS Studio
    'obs64.exe', 'obs32.exe', 'obs.exe',
    // Streamlabs Desktop
    'streamlabs desktop.exe',
    // XSplit
    'xsplit.core.exe',
    // Twitch Studio
    'twitchstudio.exe',
    // vMix
    'vmix64.exe', 'vmix.exe',
    // Wirecast
    'wirecast.exe',
  ],
  darwin: [
    // OBS Studio
    'obs', 'OBS',
    // Streamlabs Desktop
    'Streamlabs Desktop',
    // Twitch Studio
    'Twitch Studio',
    // Wirecast
    'Wirecast',
  ],
  linux: [
    // OBS Studio
    'obs',
    // Streamlabs Desktop
    'streamlabs',
  ],
};
