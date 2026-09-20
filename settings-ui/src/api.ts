import type { Decision, Evaluation, Settings, StoredState } from '../../src/types';

export type PublicSettings = Settings & {readonly hasApiKey: boolean};
export type EditableDecision = {-readonly [K in keyof Decision]: K extends 'options' ? {id: string; name: string; description: string}[] : Decision[K]};

export const api = {
    settings: () => request<PublicSettings>('GET', '/settings'),
    decisions: () => request<StoredState>('GET', '/decisions'),
    saveSettings: (body: Settings & {apiKey: string; clearApiKey: boolean}) => request<PublicSettings>('PUT', '/settings', body),
    saveDecision: (body: Decision) => request<Decision>('PUT', '/decisions', body),
    removeDecision: (id: string) => request('DELETE', `/decisions/${encodeURIComponent(id)}`),
    testDecision: (id: string, context: string) => request<Evaluation>('POST', '/test-decision', {id, context}),
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
