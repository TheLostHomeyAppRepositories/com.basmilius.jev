import { describe, expect, test } from 'bun:test';
import Decisions from '../src/brain/decisions';
import Jev, { parseResponse } from '../src/brain/jev';
import { DEFAULT_SETTINGS } from '../src/const';
import { tokens } from '../src/flow';
import type { Decision, Evaluation, Response, StoredState } from '../src/types';
import { validateDecision, validateSettings } from '../src/validation';

const choice: Decision = {
    id: 'lighting', revision: 0, name: 'Lighting', type: 'choice', question: 'Which scene fits?',
    background: 'We prefer warm light.', options: [
        {id: 'film', name: 'Film', description: 'Watching a film'},
        {id: 'bright', name: 'Bright', description: 'Reading or working'}
    ],
    minConfidence: 0.8, noThreshold: 0.2, yesThreshold: 0.8, cooldownSeconds: 60, maxAgeSeconds: 300
};
const noul: Decision = {...choice, id: 'notify', name: 'Notify', type: 'noul', options: []};

function response(value = 'film', confidence = 0.95): Response {
    return {answer: {type: 'choice', choice: value, confidence, probabilities: {film: value === 'film' ? 0.98 : 0.02, bright: value === 'bright' ? 0.98 : 0.02}}, model: 'jev-1.13.0', inputTokens: 42};
}

function fixture(evaluate: () => Promise<Response> = async () => response(), initial?: StoredState) {
    let now = 100000;
    let stored: StoredState | undefined;
    const published: {result: Evaluation; changed: boolean}[] = [];
    const engine = new Decisions({
        evaluate, settings: () => DEFAULT_SETTINGS, now: () => now,
        persist: state => { stored = state; },
        publish: async (result, changed) => { published.push({result, changed}); }
    }, initial);
    if (!initial) engine.save(choice);
    return {engine, published, advance: (ms: number) => { now += ms; }, stored: () => stored!};
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return {promise, resolve};
}

describe('decisions', () => {
    test('accepts a typed choice without storing supplied context', async () => {
        const f = fixture();
        const result = await f.engine.evaluate('lighting', 'PRIVATE CONTEXT');
        expect(result.status).toBe('accepted');
        expect(result.label).toBe('Film');
        expect(f.engine.latest('lighting')?.value).toBe('film');
        expect(JSON.stringify(f.stored())).not.toContain('PRIVATE CONTEXT');
        expect(f.published[0].changed).toBe(true);
    });

    test('uncertainty invalidates an earlier accepted result', async () => {
        let confident = true;
        const f = fixture(async () => response('film', confident ? 0.95 : 0.5));
        await f.engine.evaluate('lighting', 'Watching a film');
        confident = false;
        const result = await f.engine.evaluate('lighting', 'Unknown activity');
        expect(result.status).toBe('uncertain');
        expect(f.engine.latest('lighting')).toBeUndefined();
        expect(tokens(result).result).toBe('');
        expect(f.published.at(-1)?.changed).toBe(false);
    });

    test('Noul distinguishes no, uncertain and yes at inclusive boundaries', async () => {
        let probability = 0.2;
        const f = fixture(async () => ({answer: {type: 'noul', noul: probability}, model: 'jev-latest', inputTokens: 1}));
        f.engine.save({...noul, cooldownSeconds: 0});
        expect((await f.engine.evaluate('notify', 'Text')).value).toBe('no');
        probability = 0.5;
        const uncertain = await f.engine.evaluate('notify', 'Text');
        expect(uncertain.status).toBe('uncertain');
        expect(uncertain.value).toBe('');
        expect(uncertain.confidence).toBeNull();
        probability = 0.8;
        expect((await f.engine.evaluate('notify', 'Text')).value).toBe('yes');
    });

    test('test mode leaves production state and triggers alone', async () => {
        const f = fixture();
        const result = await f.engine.evaluate('lighting', 'Test', true);
        expect(result.test).toBe(true);
        expect(result.status).toBe('accepted');
        expect(f.engine.latest('lighting')).toBeUndefined();
        expect(f.published).toHaveLength(0);
        expect(f.stored().accepted).toEqual({});
    });

    test('the newest request wins when replies arrive out of order', async () => {
        const first = deferred<Response>();
        const second = deferred<Response>();
        let count = 0;
        const f = fixture(() => ++count === 1 ? first.promise : second.promise);
        const a = f.engine.evaluate('lighting', 'First');
        const b = f.engine.evaluate('lighting', 'Second');
        second.resolve(response('bright'));
        const current = await b;
        first.resolve(response('film'));
        expect((await a).status).toBe('superseded');
        expect(f.engine.latest('lighting')?.id).toBe(current.id);
        expect(f.published).toHaveLength(1);
    });

    test('saving or deleting a decision invalidates in-flight replies', async () => {
        for (const mutation of ['save', 'delete']) {
            const pending = deferred<Response>();
            const f = fixture(() => pending.promise);
            const result = f.engine.evaluate('lighting', 'Context');
            if (mutation === 'save') f.engine.save({...f.engine.find('lighting'), question: 'A changed question'});
            else f.engine.remove('lighting');
            pending.resolve(response());
            expect((await result).status).toBe('superseded');
            expect(f.published).toHaveLength(0);
        }
    });

    test('config changes invalidate pending replies', async () => {
        const pending = deferred<Response>();
        const f = fixture(() => pending.promise);
        const result = f.engine.evaluate('lighting', 'Context');
        f.engine.invalidate();
        pending.resolve(response());
        expect((await result).status).toBe('superseded');
    });

    test('cooldown blocks changes but unchanged answers do not extend it', async () => {
        let value = 'film';
        const f = fixture(async () => response(value));
        await f.engine.evaluate('lighting', 'First');
        f.advance(30000);
        await f.engine.evaluate('lighting', 'Same');
        value = 'bright';
        expect((await f.engine.evaluate('lighting', 'Change')).status).toBe('cooldown');
        f.advance(31000);
        expect((await f.engine.evaluate('lighting', 'Change again')).status).toBe('accepted');
        expect(f.engine.latest('lighting')?.value).toBe('bright');
    });

    test('expired results cannot be read after a restart', async () => {
        const f = fixture();
        await f.engine.evaluate('lighting', 'Context');
        const restored = fixture(undefined, f.stored());
        expect(restored.engine.latest('lighting')?.value).toBe('film');
        restored.advance(300001);
        expect(restored.engine.latest('lighting')).toBeUndefined();
    });

    test('a response that arrives after its validity window is not accepted', async () => {
        const pending = deferred<Response>();
        const f = fixture(() => pending.promise);
        const result = f.engine.evaluate('lighting', 'Context');
        f.advance(300001);
        pending.resolve(response());
        expect((await result).status).toBe('expired');
    });

    test('empty context and provider errors never become a no result', async () => {
        let calls = 0;
        const f = fixture(async () => { calls++; throw new Error('Provider unavailable'); });
        expect((await f.engine.evaluate('lighting', '   ')).status).toBe('error');
        expect(calls).toBe(0);
        const result = await f.engine.evaluate('lighting', 'Valid context');
        expect(result.status).toBe('error');
        expect(result.value).toBe('');
        expect(f.engine.latest('lighting')).toBeUndefined();
    });

    test('limits request bursts and keeps history bounded', async () => {
        let calls = 0;
        const f = fixture(async () => { calls++; return response(); });
        for (let i = 0; i < 55; i++) await f.engine.evaluate('lighting', 'Context', true);
        expect(calls).toBe(30);
        expect(f.stored().history).toHaveLength(50);
        expect(f.stored().history[0].status).toBe('error');
        f.advance(60001);
        expect((await f.engine.evaluate('lighting', 'Context', true)).status).toBe('accepted');
    });

    test('rejects stale edits and keeps IDs when renaming', () => {
        const f = fixture();
        const original = f.engine.find('lighting');
        const renamed = f.engine.save({...original, name: 'Living room'});
        expect(renamed.id).toBe(original.id);
        expect(renamed.options[0].id).toBe(original.options[0].id);
        expect(() => f.engine.save(original)).toThrow('another window');
    });
});

describe('TypeSafe boundary', () => {
    const payload = {model: 'jev-1.13.0', answers: {decision: {type: 'choice', choice: 'film', confidence: 0.95, probabilities: {film: 0.98, bright: 0.02}}}, usage: {input_tokens: 42, output_tokens: 5}};

    test('parses a documented response and rejects malformed distributions', () => {
        expect(parseResponse(payload, choice)).toEqual(response());
        for (const answer of [
            {...payload.answers.decision, choice: 'unknown'},
            {...payload.answers.decision, confidence: 2},
            {...payload.answers.decision, probabilities: {film: 0.2}},
            {...payload.answers.decision, probabilities: {film: 0.1, bright: 0.9}},
            {...payload.answers.decision, probabilities: {film: 0.8, bright: 0.8}},
            {type: 'noul', noul: 0.9}
        ]) expect(() => parseResponse({...payload, answers: {decision: answer}}, choice)).toThrow();
    });

    test('sends only explicitly supplied state and a typed question', async () => {
        let request: RequestInit | undefined;
        const client = new Jev(async (url, init) => {
            expect(url).toBe('https://api.typesafe.ai/v1/systemone');
            request = init;
            return globalThis.Response.json(payload);
        });
        await client.evaluate(choice, 'TV on', DEFAULT_SETTINGS, 'secret');
        const body = JSON.parse(request!.body as string);
        expect(body.state).toEqual({context: 'TV on', background: choice.background});
        expect(body.questions.decision.criteria.film.name).toBe('Film');
        expect(body.model).toBe('jev-latest');
        expect(request!.redirect).toBe('error');
    });

    test('never forwards provider error bodies or transport errors', async () => {
        const client = new Jev(async () => new globalThis.Response('PRIVATE CONTEXT AND KEY', {status: 500}));
        await expect(client.evaluate(choice, 'Context', DEFAULT_SETTINGS, 'secret')).rejects.toThrow('HTTP 500');
        const failed = new Jev(async () => { throw new Error('secret'); });
        await expect(failed.evaluate(choice, 'Context', DEFAULT_SETTINGS, 'secret')).rejects.toThrow('could not be reached');
    });

    test('validates decision definitions and settings on the server', () => {
        expect(() => validateDecision({...choice, noThreshold: 0.8, yesThreshold: 0.2}, 1)).toThrow();
        expect(() => validateDecision({...choice, options: [choice.options[0], choice.options[0]]}, 1)).toThrow();
        expect(() => validateDecision({...choice, id: '__proto__'}, 1)).toThrow();
        expect(() => validateSettings({...DEFAULT_SETTINGS, timeoutSeconds: Infinity})).toThrow();
    });
});
