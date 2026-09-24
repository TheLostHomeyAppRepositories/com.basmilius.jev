import { action } from '@basmilius/homey-common';
import { parseRequest } from '../../brain/request';
import JevAction, { type Tokens } from '../jevAction';

/**
 * Action that passes a hand-written request through, so a flow can ask several
 * questions about one state in a single call.
 */
@action('advanced')
export default class extends JevAction<Args, Result> {
    async onRun(args: Args): Promise<Result> {
        const response = await this.app.evaluate(parseRequest(args.json));

        return {
            ...this.tokens(response),
            answers: JSON.stringify(response.answers)
        };
    }
}

type Args = {
    readonly json: string;
};

type Result = Tokens & {
    readonly answers: string;
};
