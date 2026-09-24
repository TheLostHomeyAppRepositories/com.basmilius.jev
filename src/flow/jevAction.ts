import { FlowActionEntity } from '@basmilius/homey-common';
import type JevApp from '../index';
import type { Content, EvaluationResponse, Question } from '../types';
import { number, text } from '../validation';

/**
 * Base class for the Jev action cards. Every card asks a single question about
 * a piece of state and reports what the call cost.
 */
export default abstract class JevAction<TArgs, TResult> extends FlowActionEntity<JevApp, TArgs, never, TResult> {
    /**
     * Asks Jev one question about the state in the given arguments.
     *
     * @param args - The card arguments holding the state and the question.
     * @param body - The question to ask, without its instructions.
     */
    protected async ask(args: SimpleArgs, body: QuestionBody): Promise<EvaluationResponse> {
        const state = text(args.state, 'State', 64000);
        const instructions = text(args.question, 'Question', 8000);
        const question = {...body, instructions} as Question;

        return await this.app.evaluate({
            state,
            questions: {answer: question}
        });
    }

    /**
     * Reads the confidence threshold from the arguments.
     *
     * @param args - The card arguments.
     * @param name - The label to use when the value is out of range.
     * @param min - The lowest threshold the card accepts.
     */
    protected threshold(args: SimpleArgs, name: string, min = 0): number {
        return number(args.minimum ?? 0.8, name, min, 1);
    }

    /**
     * Maps the usage numbers of a response onto the flow tokens every card returns.
     */
    protected tokens(response: EvaluationResponse): Tokens {
        return {
            model: response.model,
            input_tokens: response.inputTokens,
            output_tokens: response.outputTokens,
            request_id: response.requestId,
            duration_ms: response.durationMs
        };
    }
}

/** The arguments shared by every card that asks a single question. */
export type SimpleArgs = {
    readonly state: string;
    readonly question: string;
    readonly minimum?: number;
};

/** A question without the instructions, which {@link JevAction.ask} validates and fills in. */
export type QuestionBody =
    | {readonly type: 'noul'}
    | {readonly type: 'choice'; readonly criteria: Record<string, Content | null>}
    | {readonly type: 'score'; readonly criteria: Content[]};

/** The flow tokens every card returns alongside its answer. */
export type Tokens = {
    readonly model: string;
    readonly input_tokens: number;
    readonly output_tokens: number;
    readonly request_id: string;
    readonly duration_ms: number;
};
