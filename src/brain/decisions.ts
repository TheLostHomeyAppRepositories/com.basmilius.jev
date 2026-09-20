import { randomUUID } from 'node:crypto';
import { HISTORY_LIMIT } from '../const';
import type { Decision, Evaluation, Response, Settings, StoredState } from '../types';
import { identifier, text, validateDecision } from '../validation';

type Dependencies = {
    readonly evaluate: (decision: Decision, context: string, settings: Settings) => Promise<Response>;
    readonly settings: () => Settings;
    readonly persist: (state: StoredState) => void;
    readonly publish: (result: Evaluation, changed: boolean) => Promise<void>;
    readonly now?: () => number;
};

export default class Decisions {
    readonly #dependencies: Dependencies;
    readonly #state: StoredState;
    readonly #active = new Map<string, string>();
    #calls: number[] = [];
    #pending = 0;

    constructor(dependencies: Dependencies, state?: StoredState) {
        this.#dependencies = dependencies;
        this.#state = state ? structuredClone(state) : {decisions: [], latest: {}, accepted: {}, history: []};
    }

    snapshot(): StoredState {
        return structuredClone(this.#state);
    }

    find(id: string): Decision {
        const decision = this.#state.decisions.find(item => item.id === id);
        if (!decision) throw new Error('Decision no longer exists. Select a decision again.');
        return structuredClone(decision);
    }

    save(input: unknown): Decision {
        const id = identifier((input as Record<string, unknown> | null)?.id);
        const previous = this.#state.decisions.find(item => item.id === id);
        if (previous && (input as Record<string, unknown>).revision !== previous.revision) {
            throw new Error('This decision changed in another window. Reload before saving.');
        }
        const decision = validateDecision(input, (previous?.revision ?? 0) + 1);
        if (this.#state.decisions.some(item => item.id !== id && item.name.toLowerCase() === decision.name.toLowerCase())) {
            throw new Error('A decision with this name already exists.');
        }
        if (previous && previous.type !== decision.type) throw new Error('Create a new decision to change its type.');
        if (!previous && this.#state.decisions.length >= 100) throw new Error('Maximum of 100 decisions reached.');
        const index = this.#state.decisions.findIndex(item => item.id === id);
        if (index >= 0) this.#state.decisions[index] = decision;
        else this.#state.decisions.push(decision);
        delete this.#state.latest[id];
        delete this.#state.accepted[id];
        this.#active.delete(id);
        this.#persist();
        return structuredClone(decision);
    }

    remove(id: string): void {
        this.find(id);
        this.#state.decisions.splice(this.#state.decisions.findIndex(item => item.id === id), 1);
        delete this.#state.latest[id];
        delete this.#state.accepted[id];
        this.#active.delete(id);
        this.#persist();
    }

    invalidate(): void {
        this.#active.clear();
        for (const id of Object.keys(this.#state.latest)) delete this.#state.latest[id];
        for (const id of Object.keys(this.#state.accepted)) delete this.#state.accepted[id];
        this.#persist();
    }

    latest(id: string): Evaluation | undefined {
        const decision = this.find(id);
        const result = this.#state.latest[id];
        if (!result || result.status !== 'accepted' || result.revision !== decision.revision
            || this.#now() - result.startedAt > decision.maxAgeSeconds * 1000) return undefined;
        return structuredClone(result);
    }

    async evaluate(id: string, input: unknown, test = false): Promise<Evaluation> {
        const decision = this.find(id);
        const startedAt = this.#now();
        const requestId = randomUUID();
        const settings = this.#dependencies.settings();
        if (!test) {
            this.#active.set(id, requestId);
            delete this.#state.latest[id];
            this.#persist();
        }

        let result: Evaluation = {
            id: requestId, decisionId: id, decisionName: decision.name, revision: decision.revision,
            type: decision.type, startedAt, completedAt: startedAt,
            status: 'error', value: '', label: '', confidence: null, probability: null,
            model: settings.model, inputTokens: 0, durationMs: 0, error: '', test
        };

        try {
            const context = text(input, 'Context', 64000);
            this.#calls = this.#calls.filter(at => startedAt - at < 60000);
            if (this.#calls.length >= settings.maxCallsPerMinute) throw new Error('App request limit reached. Try again in a minute.');
            if (this.#pending >= 4) throw new Error('Four evaluations are already running. Try again shortly.');
            this.#calls.push(startedAt);
            this.#pending++;
            let response: Response;
            try {
                response = await this.#dependencies.evaluate(decision, context, settings);
            } finally {
                this.#pending--;
            }

            const {answer} = response;
            const value = answer.type === 'choice' ? answer.choice
                : answer.noul >= decision.yesThreshold ? 'yes'
                : answer.noul <= decision.noThreshold ? 'no' : '';
            const accepted = answer.type === 'choice' ? answer.confidence >= decision.minConfidence : value !== '';
            result = {
                ...result, model: response.model, inputTokens: response.inputTokens,
                status: accepted ? 'accepted' : 'uncertain', value,
                label: answer.type === 'choice' ? decision.options.find(option => option.id === value)!.name : value,
                confidence: answer.type === 'choice' ? answer.confidence : null,
                probability: answer.type === 'noul' ? answer.noul : answer.probabilities[value]
            };
        } catch (error) {
            result = {...result, error: error instanceof Error ? error.message : 'Evaluation failed.'};
        }

        const completedAt = this.#now();
        result = {...result, completedAt, durationMs: completedAt - startedAt};
        const current = this.#state.decisions.find(item => item.id === id);
        const superseded = !current || current.revision !== decision.revision || (!test && this.#active.get(id) !== requestId);
        const previous = this.#state.accepted[id];
        if (superseded) result = {...result, status: 'superseded'};
        else if (completedAt - startedAt > decision.maxAgeSeconds * 1000) result = {...result, status: 'expired'};
        else if (!test && result.status === 'accepted' && previous && previous.value !== result.value
            && completedAt - previous.completedAt < decision.cooldownSeconds * 1000) result = {...result, status: 'cooldown'};

        if (!test && !superseded) {
            this.#active.delete(id);
            this.#state.latest[id] = result;
            if (result.status === 'accepted') {
                // Unchanged answers refresh validity, but do not restart the minimum time between changes.
                this.#state.accepted[id] = previous?.value === result.value ? {...result, completedAt: previous.completedAt} : result;
            }
        }
        this.#state.history.unshift(result);
        this.#state.history.splice(HISTORY_LIMIT);
        this.#persist();
        if (!test && !superseded) await this.#dependencies.publish(result, result.status === 'accepted' && previous?.value !== result.value);
        return result;
    }

    #now(): number {
        return this.#dependencies.now?.() ?? Date.now();
    }

    #persist(): void {
        this.#dependencies.persist(this.snapshot());
    }
}
