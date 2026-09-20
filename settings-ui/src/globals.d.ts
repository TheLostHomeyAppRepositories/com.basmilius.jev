declare const Homey: {
    api<T>(method: 'GET' | 'PUT' | 'POST' | 'DELETE', path: string, body: object | null, callback: (error: Error | string | null, result: T) => void): void;
    __(key: string): string;
    ready(): void;
};

interface Window {
    onHomeyReady(): void;
}
