import type JevApp from '../index';
import { parseRequest } from '../brain/request';
import type { EvaluationRequest, EvaluationResponse, Question } from '../types';
import { number, text } from '../validation';

type SimpleArgs = {
    readonly state: string;
    readonly question: string;
    readonly minimum?: number;
};

type ChoiceArgs = SimpleArgs & {readonly answer_1: string; readonly answer_2: string; readonly answer_3?: string; readonly answer_4?: string};
type ScoreArgs = SimpleArgs & {readonly low: string; readonly middle: string; readonly high: string};

export function registerFlows(app: Pick<JevApp, 'evaluate' | 'homey'>): void {
    const flow = app.homey.flow;

    for (const count of [2, 3, 4] as const) {
        flow.getActionCard(`choice_${count}`).registerRunListener(async (args: ChoiceArgs) => {
            const minimum = number(args.minimum ?? 0.8, 'Minimum confidence', 0, 1);
            const answers = [args.answer_1, args.answer_2, ...(count >= 3 ? [args.answer_3] : []), ...(count === 4 ? [args.answer_4] : [])]
                .map(answer => text(answer, 'Answer', 2000));
            if (new Set(answers.map(answer => answer.toLowerCase())).size !== answers.length) throw new Error('Answers must be different.');
            const criteria = Object.fromEntries(answers.map((answer, index) => [`answer_${index + 1}`, answer]));
            const response = await app.evaluate(request(args, {type: 'choice', instructions: args.question, criteria}));
            const answer = response.answers.answer;
            if (answer.type !== 'choice') throw new Error('Unexpected answer type.');
            if (answer.confidence < minimum) throw new Error(`Jev is uncertain. Choice confidence: ${answer.confidence}; required: at least ${minimum}.`);
            const index = Number(answer.choice.slice('answer_'.length)) - 1;
            return {...tokens(response), answer: answers[index], answer_number: index + 1, confidence: answer.confidence, probability: answer.probabilities[answer.choice]};
        });
    }

    async function yesNo(args: SimpleArgs) {
        const minimum = number(args.minimum ?? 0.8, 'Minimum probability', 0.51, 1);
        const response = await app.evaluate(request(args, {type: 'noul', instructions: args.question}));
        const answer = response.answers.answer;
        if (answer.type !== 'noul') throw new Error('Unexpected answer type.');
        const isYes = answer.noul >= minimum;
        const maximumNo = Number((1 - minimum).toFixed(12));
        if (!isYes && answer.noul > maximumNo) {
            throw new Error(`Jev is uncertain. Probability of yes: ${answer.noul}; yes requires at least ${minimum}, no requires at most ${maximumNo}.`);
        }
        return {...tokens(response), answer: isYes, probability: answer.noul};
    }

    flow.getActionCard('yes_no').registerRunListener(yesNo);
    // Uncertainty throws so an inverted condition cannot turn an unavailable answer into permission to act.
    flow.getConditionCard('yes_no').registerRunListener(async (args: SimpleArgs) => (await yesNo(args)).answer);

    flow.getActionCard('score').registerRunListener(async (args: ScoreArgs) => {
        const minimum = number(args.minimum ?? 0.8, 'Minimum confidence', 0, 1);
        const criteria = [args.low, args.middle, args.high].map(level => text(level, 'Level description', 2000));
        if (new Set(criteria.map(level => level.toLowerCase())).size !== criteria.length) throw new Error('Describe three different score levels.');
        const response = await app.evaluate(request(args, {type: 'score', instructions: args.question, criteria}));
        const answer = response.answers.answer;
        if (answer.type !== 'score') throw new Error('Unexpected answer type.');
        if (answer.confidence < minimum) throw new Error(`Jev is uncertain. Score confidence: ${answer.confidence}; required: at least ${minimum}.`);
        return {...tokens(response), score: answer.score, confidence: answer.confidence};
    });

    flow.getActionCard('advanced').registerRunListener(async (args: {readonly json: string}) => {
        const response = await app.evaluate(parseRequest(args.json));
        return {...tokens(response), answers: JSON.stringify(response.answers)};
    });
}

function request(args: SimpleArgs, question: Question): EvaluationRequest {
    const state = text(args.state, 'State', 64000);
    const instructions = text(args.question, 'Question', 8000);
    return {state, questions: {answer: {...question, instructions}}};
}

function tokens(response: EvaluationResponse) {
    return {
        model: response.model,
        input_tokens: response.inputTokens,
        output_tokens: response.outputTokens,
        request_id: response.requestId,
        duration_ms: response.durationMs
    };
}
