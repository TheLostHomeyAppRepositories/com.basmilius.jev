import type { Settings } from '../../src/types';

export type PublicSettings = Settings & {readonly hasApiKey: boolean};

export const api = {
    settings: () => request<PublicSettings>('GET', '/settings'),
    saveSettings: (body: Settings & {apiKey: string; clearApiKey: boolean}) => request<PublicSettings>('PUT', '/settings', body),
    testConnection: () => request<{model: string}>('POST', '/test-connection')
};

function request<T>(method: 'GET' | 'PUT' | 'POST' | 'DELETE', path: string, body: object | null = null): Promise<T> {
    return new Promise((resolve, reject) => {
        Homey.api<T>(method, path, body, (error, result) => {
            if (error) reject(error instanceof Error ? error : new Error(error));
            else resolve(result);
        });
    });
}
