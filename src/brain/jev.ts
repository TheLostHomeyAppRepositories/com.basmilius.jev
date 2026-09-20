import { API_URL } from '../const';
import type { Decision, Response, Settings } from '../types';
import { number, record, text } from '../validation';

export type Transport = (url: string, init: RequestInit) => Promise<globalThis.Response>;

export default class Jev {
    constructor(private readonly transport: Transport = fetch) {}

    async evaluate(decision: Decision, context: string, settings: Settings, apiKey: string): Promise<Response> {
        if (!apiKey) throw new Error('Set your TypeSafe API key in the app settings.');
        const question = decision.type === 'choice'
            ? {type: 'choice', instructions: decision.question, criteria: Object.fromEntries(decision.options.map(option => [option.id, {name: option.name, description: option.description}]))}
            : {type: 'noul', instructions: decision.question};

        let response: globalThis.Response;
        try {
            response = await this.transport(API_URL, {
                method: 'POST',
                headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    model: settings.model,
                    state: decision.background ? {context, background: decision.background} : context,
                    questions: {decision: question}
                }),
                signal: AbortSignal.timeout(settings.timeoutSeconds * 1000),
                redirect: 'error'
            });
        } catch {
            throw new Error('TypeSafe could not be reached or the request timed out.');
        }

        // Provider error bodies can echo context or credentials; never forward them to logs or Flows.
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error('TypeSafe rejected the API key or account access.');
            if (response.status === 429) throw new Error('TypeSafe rate limit reached. Try again later.');
            if (response.status === 402) throw new Error('TypeSafe requires available credit.');
            throw new Error(`TypeSafe request failed (HTTP ${response.status}).`);
        }

        try {
            return parseResponse(await response.json(), decision);
        } catch {
            throw new Error('TypeSafe returned an invalid decision response.');
        }
    }
}

export function parseResponse(value: unknown, decision: Decision): Response {
    const body = record(value);
    const answer = record(record(body.answers).decision);
    const usage = record(body.usage);
    const model = text(body.model, 'Response model', 100);
    const inputTokens = number(usage.input_tokens, 'Input tokens', 0, Number.MAX_SAFE_INTEGER);
    if (!Number.isInteger(inputTokens) || answer.type !== decision.type) throw new Error('Invalid response.');

    if (answer.type === 'noul') {
        return {answer: {type: 'noul', noul: number(answer.noul, 'Probability', 0, 1)}, model, inputTokens};
    }

    const choice = text(answer.choice, 'Choice', 80);
    if (!decision.options.some(option => option.id === choice)) throw new Error('Unknown option.');
    const probabilities = record(answer.probabilities);
    if (Object.keys(probabilities).length !== decision.options.length) throw new Error('Incomplete probabilities.');
    const entries = decision.options.map(option => [option.id, number(probabilities[option.id], 'Probability', 0, 1)] as const);
    const total = entries.reduce((sum, [, probability]) => sum + probability, 0);
    if (Math.abs(total - 1) > 0.01) throw new Error('Invalid probability distribution.');
    const selected = probabilities[choice] as number;
    if (entries.some(([, probability]) => probability > selected + 0.00001)) throw new Error('Choice does not match probabilities.');

    return {answer: {type: 'choice', choice, confidence: number(answer.confidence, 'Confidence', 0, 1), probabilities: Object.fromEntries(entries)}, model, inputTokens};
}
