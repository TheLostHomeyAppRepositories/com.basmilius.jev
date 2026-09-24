import { action } from '@basmilius/homey-common';
import JevAction, { type SimpleArgs, type Tokens } from '../jevAction';
import { text } from '../../validation';

/**
 * Action that picks the answer that fits the state best, out of a list of
 * answers separated by newlines.
 */
@action('choice_list')
export default class extends JevAction<Args, Result> {
    async onRun(args: Args): Promise<Result> {
        const answers = text(args.answers, 'Answer list', 64000)
            .split(/\r\n|\r|\n/)
            .map(answer => answer.trim())
            .filter(Boolean);

        const minimum = this.threshold(args, 'Minimum confidence');

        if (answers.length < 2 || answers.length > 255) {
            throw new Error('Supply between 2 and 255 answers.');
        }

        const validated = answers.map(answer => text(answer, 'Answer', 2000));

        if (new Set(validated.map(answer => answer.toLowerCase())).size !== validated.length) {
            throw new Error('Answers must be different.');
        }

        const criteria = Object.fromEntries(
            validated.map((answer, index) => [`answer_${index + 1}`, answer])
        );

        const response = await this.ask(args, {type: 'choice', criteria});
        const answer = response.answers.answer;

        if (answer.type !== 'choice') {
            throw new Error('Unexpected answer type.');
        }

        if (answer.confidence < minimum) {
            throw new Error(`Jev is uncertain. Choice confidence: ${answer.confidence}; required: at least ${minimum}.`);
        }

        const index = Number(answer.choice.slice('answer_'.length)) - 1;

        return {
            ...this.tokens(response),
            answer: validated[index],
            answer_number: index + 1,
            confidence: answer.confidence,
            probability: answer.probabilities[answer.choice]
        };
    }
}

type Args = SimpleArgs & {
    readonly answers: string;
};

type Result = Tokens & {
    readonly answer: string;
    readonly answer_number: number;
    readonly confidence: number;
    readonly probability: number;
};
