export type Settings = {
    readonly model: string;
    readonly timeoutSeconds: number;
    readonly maxCallsPerMinute: number;
};

export type Json = string | number | boolean | null | Json[] | {[key: string]: Json};
export type Content = string | Json[] | {[key: string]: Json};

export type Question =
    | {readonly type: 'noul'; readonly instructions: Content; readonly criteria?: {readonly true: Content; readonly false: Content}}
    | {readonly type: 'choice'; readonly instructions: Content; readonly criteria: Record<string, Content | null>}
    | {readonly type: 'score'; readonly instructions: Content; readonly criteria: Content[]};

export type EvaluationRequest = {
    readonly state: Content;
    readonly questions: Record<string, Question>;
};

export type Answer =
    | {readonly type: 'choice'; readonly choice: string; readonly confidence: number; readonly probabilities: Record<string, number>}
    | {readonly type: 'noul'; readonly noul: number}
    | {readonly type: 'score'; readonly score: number; readonly confidence: number; readonly probabilities: Record<string, number>; readonly legend: Record<string, Json>};

export type EvaluationResponse = {
    readonly answers: Record<string, Answer>;
    readonly model: string;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly requestId: string;
    readonly durationMs: number;
};
