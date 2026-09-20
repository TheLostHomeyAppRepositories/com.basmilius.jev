import { ref } from 'vue';
import { api, type PublicSettings } from './api';

export function useJev() {
    const settings = ref<PublicSettings>();
    const busy = ref(false);
    const error = ref('');
    const notice = ref('');

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
        await run(async () => { settings.value = await api.settings(); });
    }

    return {settings, busy, error, notice, run, reload};
}
