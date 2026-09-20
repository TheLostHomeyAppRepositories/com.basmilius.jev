import { App } from '@basmilius/homey-common';
import Decisions from './brain/decisions';
import Jev from './brain/jev';
import { DEFAULT_SETTINGS, SETTING_API_KEY, SETTING_CONFIG, SETTING_STATE } from './const';
import { registerFlows, tokens } from './flow';
import type { Evaluation, Settings, StoredState } from './types';
import { record, text, validateSettings } from './validation';

export default class JevApp extends App<JevApp> {
    decisions!: Decisions;
    readonly #client = new Jev();

    async onInit(): Promise<void> {
        this.decisions = new Decisions({
            settings: () => this.config,
            evaluate: (decision, context, settings) => this.#client.evaluate(decision, context, settings, this.homey.settings.get(SETTING_API_KEY) ?? ''),
            persist: state => this.homey.settings.set(SETTING_STATE, state),
            publish: (result, changed) => this.#publish(result, changed)
        }, this.homey.settings.get(SETTING_STATE) as StoredState | undefined);
        registerFlows(this);
        this.log('Jev initialized. Context is supplied by the user.');
    }

    get config(): Settings {
        return validateSettings(this.homey.settings.get(SETTING_CONFIG) ?? DEFAULT_SETTINGS);
    }

    getSettings() {
        return {...this.config, hasApiKey: !!this.homey.settings.get(SETTING_API_KEY)};
    }

    saveSettings(input: unknown) {
        const body = record(input);
        const config = validateSettings(body);
        const apiKey = body.apiKey === undefined ? '' : text(body.apiKey, 'API key', 512, true);
        if (apiKey && /\s/.test(apiKey)) throw new Error('API key cannot contain whitespace.');
        if (body.clearApiKey === true) this.homey.settings.unset(SETTING_API_KEY);
        else if (apiKey) this.homey.settings.set(SETTING_API_KEY, apiKey);
        this.homey.settings.set(SETTING_CONFIG, config);
        this.decisions.invalidate();
        return this.getSettings();
    }

    async testConnection() {
        const response = await this.#client.evaluate({
            id: 'connection', revision: 1, name: 'Connection test', type: 'noul',
            question: 'Does the supplied text say hello?', background: '', options: [],
            minConfidence: 0.8, noThreshold: 0.2, yesThreshold: 0.8, cooldownSeconds: 0, maxAgeSeconds: 30
        }, 'Hello', this.config, this.homey.settings.get(SETTING_API_KEY) ?? '');
        return {model: response.model, inputTokens: response.inputTokens};
    }

    async #publish(result: Evaluation, changed: boolean): Promise<void> {
        const ids = result.status === 'accepted' ? ['evaluated', ...(changed ? ['changed'] : [])] : ['unavailable'];
        for (const id of ids) {
            try {
                await this.homey.flow.getTriggerCard(id).trigger(tokens(result), {decisionId: result.decisionId});
            } catch {
                this.error(`Could not deliver Jev trigger ${id} for evaluation ${result.id}.`);
            }
        }
    }
}
