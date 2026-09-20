import type { Settings } from './types';

export function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected an object.');
    }
    return value as Record<string, unknown>;
}

export function text(value: unknown, name: string, max: number, optional = false): string {
    if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) {
        throw new Error(`${name} must contain ${optional ? '0' : '1'}–${max} characters.`);
    }
    return value.trim();
}

export function number(value: unknown, name: string, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        throw new Error(`${name} must be between ${min} and ${max}.`);
    }
    return value;
}

export function identifier(value: unknown): string {
    const id = text(value, 'ID', 80);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id) || ['constructor', 'prototype', '__proto__'].includes(id)) {
        throw new Error('Invalid ID.');
    }
    return id;
}

export function validateSettings(input: unknown): Settings {
    const data = record(input);
    const model = text(data.model, 'Model', 100);
    if (!/^jev-[a-zA-Z0-9.-]+$/.test(model)) throw new Error('Invalid Jev model name.');
    return {
        model,
        timeoutSeconds: number(data.timeoutSeconds, 'Timeout', 1, 30),
        maxCallsPerMinute: Math.floor(number(data.maxCallsPerMinute, 'Calls per minute', 1, 120))
    };
}
