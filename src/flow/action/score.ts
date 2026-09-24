import { action } from '@basmilius/homey-common';
import JevAction, { type SimpleArgs, type Tokens } from '../jevAction';
import { text } from '../../validation';

/**
 * Action that scores the state against three described levels and returns a
 * value that may fall between them.
 */
@action('score')
export default class extends JevAction<Args, Result> {
    async onRun(args: Args): Promise<Result> {
        const minimum = this.threshold(args, 'Minimum confidence');
        const criteria = [args.low, args.middle, args.high]
            .map(level => text(level, 'Level description', 2000));

        if (new Set(criteria.map(level => level.toLowerCase())).size !== criteria.length) {
            throw new Error('Describe three different score levels.');
        }

        const response = await this.ask(args, {type: 'score', criteria});
        const answer = response.answers.answer;

        if (answer.type !== 'score') {
            throw new Error('Unexpected answer type.');
        }

        if (answer.confidence < minimum) {
            throw new Error(`Jev is uncertain. Score confidence: ${answer.confidence}; required: at least ${minimum}.`);
        }

        return {
            ...this.tokens(response),
            score: answer.score,
            confidence: answer.confidence
        };
    }
}

type Args = SimpleArgs & {
    readonly low: string;
    readonly middle: string;
    readonly high: string;
};

type Result = Tokens & {
    readonly score: number;
    readonly confidence: number;
};
