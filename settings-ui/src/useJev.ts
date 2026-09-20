import { computed, ref } from 'vue';
import { api, type EditableDecision, type PublicSettings } from './api';
import type { Decision, Evaluation, StoredState } from '../../src/types';

export function useJev() {
    const settings = ref<PublicSettings>();
    const state = ref<StoredState>();
    const draft = ref<EditableDecision>();
    const busy = ref(false);
    const error = ref('');
    const notice = ref('');
    const testResult = ref<Evaluation>();
    const dirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== JSON.stringify(state.value?.decisions.find(item => item.id === draft.value?.id)));

    async function run(action: () => Promise<void>): Promise<void> {
        if (busy.value) return;
        busy.value = true;
        error.value = '';
        notice.value = '';
        try { await action(); }
        catch (cause) { error.value = cause instanceof Error ? cause.message : String(cause); }
        finally { busy.value = false; }
    }

    async function reload(): Promise<void> {
        await run(async () => {
            [settings.value, state.value] = await Promise.all([api.settings(), api.decisions()]);
        });
    }

    function select(decision?: Decision): void {
        draft.value = decision ? JSON.parse(JSON.stringify(decision)) : undefined;
        testResult.value = undefined;
    }

    function create(type: Decision['type']): void {
        select({
            id: crypto.randomUUID(), revision: 0, name: '', type, question: '', background: '',
            options: type === 'choice' ? [
                {id: crypto.randomUUID(), name: '', description: ''},
                {id: crypto.randomUUID(), name: '', description: ''}
            ] : [],
            minConfidence: 0.8, noThreshold: 0.2, yesThreshold: 0.8, cooldownSeconds: 0, maxAgeSeconds: 300
        });
    }

    async function save(): Promise<void> {
        if (!draft.value) return;
        const payload = JSON.parse(JSON.stringify(draft.value));
        await run(async () => {
            select(await api.saveDecision(payload));
            state.value = await api.decisions();
        });
    }

    async function remove(): Promise<void> {
        if (!draft.value) return;
        const id = draft.value.id;
        await run(async () => {
            await api.removeDecision(id);
            select();
            state.value = await api.decisions();
        });
    }

    async function test(context: string): Promise<void> {
        if (!draft.value || dirty.value) return;
        const id = draft.value.id;
        testResult.value = undefined;
        await run(async () => {
            testResult.value = await api.testDecision(id, context);
            state.value = await api.decisions();
        });
    }

    return {settings, state, draft, busy, error, notice, dirty, testResult, run, reload, select, create, save, remove, test};
}
