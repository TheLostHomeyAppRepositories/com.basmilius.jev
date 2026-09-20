export type MessageKey = 'introDetail' | 'connection' | 'apiKey' | 'keySaved' | 'keyMissing' | 'clearKey' | 'model' | 'timeout' | 'callLimit' | 'saveConnection' | 'testConnection' | 'connectionOk' | 'saved' | 'billable' | 'loading' | 'retry' | 'flowHelp' | 'privacy' | 'advancedHelp';

export function t(key: MessageKey): string {
    return Homey.__(`settings.${key}`);
}
