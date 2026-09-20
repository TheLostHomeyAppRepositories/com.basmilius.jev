import type JevApp from '../index';
import type { Evaluation } from '../types';
import { identifier, number } from '../validation';

type DecisionArgs = { readonly decision: { readonly id: string } };
type OutcomeArgs = DecisionArgs & { readonly outcome: { readonly id: string } };
type TriggerState = { readonly decisionId: string };

export function tokens(result: Evaluation) {
    return {
        result: result.status === 'accepted' ? result.value : '',
        label: result.status === 'accepted' ? result.label : '',
        status: result.status,
        confidence: result.confidence ?? -1,
        probability: result.probability ?? -1,
        request_id: result.id,
        evaluated_at: new Date(result.startedAt).toISOString(),
        duration_ms: result.durationMs,
        model: result.model,
        error: result.error
    };
}

export function registerFlows(app: JevApp): void {
    const flow = app.homey.flow;
    const evaluate = flow.getActionCard('evaluate');
    const outcome = flow.getConditionCard('outcome_is');
    const fresh = flow.getConditionCard('result_fresh');
    const cards = [evaluate, outcome, fresh];

    for (const id of ['evaluated', 'changed', 'unavailable']) {
        const card = flow.getTriggerCard(id);
        card.registerRunListener(async (args: DecisionArgs, state: TriggerState) => args.decision.id === state.decisionId);
        cards.push(card);
    }

    for (const card of cards) {
        card.registerArgumentAutocompleteListener('decision', async (query: string) => app.decisions.snapshot().decisions
            .filter(decision => decision.name.toLowerCase().includes(query.toLowerCase()))
            .map(decision => ({id: decision.id, name: decision.name, description: decision.question})));
    }

    evaluate.registerRunListener(async (args: DecisionArgs & { readonly context: string }) => {
        const result = await app.decisions.evaluate(identifier(args.decision?.id), args.context);
        // Stop this Advanced Flow branch on uncertainty as well as errors. Ordinary Flows can use the unavailable trigger.
        if (result.status !== 'accepted') throw new Error(result.error || `Decision not accepted: ${result.status}.`);
        return tokens(result);
    });

    outcome.registerArgumentAutocompleteListener('outcome', async (query: string, args: DecisionArgs) => {
        if (!args.decision?.id) return [];
        const decision = app.decisions.find(identifier(args.decision.id));
        const options = decision.type === 'choice' ? decision.options : [
            {id: 'yes', name: app.homey.__('flow.yes')},
            {id: 'no', name: app.homey.__('flow.no')}
        ];
        return options.filter(option => option.name.toLowerCase().includes(query.toLowerCase()))
            .map(option => ({id: option.id, name: option.name}));
    });

    outcome.registerRunListener(async (args: OutcomeArgs) => {
        const id = identifier(args.decision?.id);
        const expected = identifier(args.outcome?.id);
        const decision = app.decisions.find(id);
        const exists = decision.type === 'noul' ? ['yes', 'no'].includes(expected) : decision.options.some(option => option.id === expected);
        if (!exists) throw new Error(app.homey.__('flow.missing_option'));
        const result = app.decisions.latest(id);
        // Throw rather than return false: an inverted condition must not treat missing data as an accepted answer.
        if (!result) throw new Error(app.homey.__('flow.no_result'));
        return result.value === expected;
    });
    fresh.registerRunListener(async (args: DecisionArgs & { readonly seconds: number }) => {
        const result = app.decisions.latest(identifier(args.decision?.id));
        return !!result && Date.now() - result.startedAt <= number(args.seconds, 'Seconds', 1, 86400) * 1000;
    });
}
