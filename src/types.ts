export type Option = {
    readonly id: string;
    readonly name: string;
    readonly description: string;
};

export type Decision = {
    readonly id: string;
    readonly revision: number;
    readonly name: string;
    readonly type: 'choice' | 'noul';
    readonly question: string;
    readonly background: string;
    readonly options: readonly Option[];
    readonly minConfidence: number;
    readonly yesThreshold: number;
    readonly noThreshold: number;
    readonly cooldownSeconds: number;
    readonly maxAgeSeconds: number;
};

export type Settings = {
    readonly model: string;
    readonly timeoutSeconds: number;
    readonly maxCallsPerMinute: number;
};

export type Answer =
    | { readonly type: 'choice'; readonly choice: string; readonly confidence: number; readonly probabilities: Record<string, number> }
    | { readonly type: 'noul'; readonly noul: number };

export type Response = {
    readonly answer: Answer;
    readonly model: string;
    readonly inputTokens: number;
};

export type Evaluation = {
    readonly id: string;
    readonly decisionId: string;
    readonly decisionName: string;
    readonly revision: number;
    readonly type: Decision['type'];
    readonly startedAt: number;
    readonly completedAt: number;
    readonly status: 'accepted' | 'uncertain' | 'error' | 'superseded' | 'cooldown' | 'expired';
    readonly value: string;
    readonly label: string;
    readonly confidence: number | null;
    readonly probability: number | null;
    readonly model: string;
    readonly inputTokens: number;
    readonly durationMs: number;
    readonly error: string;
    readonly test: boolean;
};

export type StoredState = {
    readonly decisions: Decision[];
    readonly latest: Record<string, Evaluation>;
    readonly accepted: Record<string, Evaluation>;
    readonly history: Evaluation[];
};
