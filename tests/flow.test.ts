import { expect, test } from 'bun:test';
import Decisions from '../src/brain/decisions';
import { DEFAULT_SETTINGS } from '../src/const';
import { registerFlows } from '../src/flow';
import type JevApp from '../src/index';
import type { Evaluation } from '../src/types';

class Card {
    run!: (args: any, state?: any) => Promise<any>;
    autocomplete: Record<string, (query: string, args?: any) => Promise<any>> = {};

    registerRunListener(listener: Card['run']): this { this.run = listener; return this; }
    registerArgumentAutocompleteListener(name: string, listener: (query: string, args?: any) => Promise<any>): this {
        this.autocomplete[name] = listener;
        return this;
    }
}

function fixture() {
    let probability = 0.95;
    const published: Evaluation[] = [];
    const decisions = new Decisions({
        settings: () => DEFAULT_SETTINGS,
        evaluate: async () => ({answer: {type: 'noul', noul: probability}, model: 'jev-latest', inputTokens: 2}),
        persist: () => {}, publish: async result => { published.push(result); }
    });
    decisions.save({id: 'notify', revision: 0, name: 'Notify', type: 'noul', question: 'Notify now?', background: '', options: [], minConfidence: 0.8, noThreshold: 0.2, yesThreshold: 0.8, cooldownSeconds: 0, maxAgeSeconds: 60});
    const cards = new Map<string, Card>();
    function card(id: string): Card {
        if (!cards.has(id)) cards.set(id, new Card());
        return cards.get(id)!;
    }
    const app = {decisions, homey: {__: (key: string) => key, flow: {getActionCard: card, getConditionCard: card, getTriggerCard: card}}};
    registerFlows(app as unknown as JevApp);
    return {card, published, setProbability: (value: number) => { probability = value; }};
}

test('Flow action returns invocation tokens and rejects uncertain answers', async () => {
    const f = fixture();
    const args = {decision: {id: 'notify'}, context: 'A message'};
    const tokens = await f.card('evaluate').run(args);
    expect(tokens.result).toBe('yes');
    expect(tokens.confidence).toBe(-1);
    expect(tokens.probability).toBe(0.95);
    expect(tokens.request_id).toBe(f.published[0].id);
    f.setProbability(0.5);
    await expect(f.card('evaluate').run(args)).rejects.toThrow('uncertain');
    expect(f.published.at(-1)?.status).toBe('uncertain');
});

test('missing data and deleted options cannot pass an inverted outcome condition', async () => {
    const f = fixture();
    const args = {decision: {id: 'notify'}, outcome: {id: 'yes'}};
    await expect(f.card('outcome_is').run(args)).rejects.toThrow('no_result');
    await f.card('evaluate').run({decision: {id: 'notify'}, context: 'Text'});
    expect(await f.card('outcome_is').run(args)).toBe(true);
    await expect(f.card('outcome_is').run({...args, outcome: {id: 'removed'}})).rejects.toThrow('missing_option');
});

test('triggers filter by stable decision ID and autocomplete offers outcomes', async () => {
    const f = fixture();
    expect(await f.card('evaluated').run({decision: {id: 'notify'}}, {decisionId: 'another'})).toBe(false);
    expect(await f.card('evaluated').run({decision: {id: 'notify'}}, {decisionId: 'notify'})).toBe(true);
    expect(await f.card('evaluate').autocomplete.decision('not')).toHaveLength(1);
    expect(await f.card('outcome_is').autocomplete.outcome('', {decision: {id: 'notify'}})).toHaveLength(2);
    expect(await f.card('result_fresh').run({decision: {id: 'notify'}, seconds: 60})).toBe(false);
});
