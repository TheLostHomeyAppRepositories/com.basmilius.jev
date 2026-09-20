import type { Decision, Settings } from './types';

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

export function validateDecision(input: unknown, revision: number): Decision {
    const data = record(input);
    if (data.type !== 'choice' && data.type !== 'noul') throw new Error('Choose Choice or Yes/no.');
    const options = data.type === 'choice' && Array.isArray(data.options) ? data.options.map(item => {
        const option = record(item);
        return {
            id: identifier(option.id),
            name: text(option.name, 'Option name', 100),
            description: text(option.description, 'Option description', 2000, true)
        };
    }) : [];

    if (data.type === 'choice' && (options.length < 2 || options.length > 255)) throw new Error('Provide 2–255 options.');
    if (new Set(options.map(option => option.id)).size !== options.length) throw new Error('Option IDs must be unique.');
    if (new Set(options.map(option => option.name.toLowerCase())).size !== options.length) throw new Error('Option names must be unique.');

    const noThreshold = number(data.noThreshold, 'No threshold', 0, 1);
    const yesThreshold = number(data.yesThreshold, 'Yes threshold', 0, 1);
    if (noThreshold >= yesThreshold) throw new Error('No threshold must be below yes threshold.');

    return {
        id: identifier(data.id), revision,
        name: text(data.name, 'Name', 100), type: data.type,
        question: text(data.question, 'Question', 8000),
        background: text(data.background, 'Background', 16000, true), options,
        minConfidence: number(data.minConfidence, 'Minimum confidence', 0, 1),
        noThreshold, yesThreshold,
        cooldownSeconds: number(data.cooldownSeconds, 'Cooldown', 0, 86400),
        maxAgeSeconds: number(data.maxAgeSeconds, 'Maximum age', 1, 86400)
    };
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
