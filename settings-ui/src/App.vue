<template>
    <main>
        <Top title="Jev" :subtitle="t('introDetail')" />
        <p v-if="error" class="feedbackError" role="alert">{{ error }} <ButtonTransparent v-if="!settings" :disabled="busy" :label="t('retry')" @click="reload" /></p>
        <p v-if="notice" class="feedbackSuccess" role="status">{{ notice }}</p>
        <p v-if="!settings && busy" role="status">{{ t('loading') }}</p>
        <template v-if="settings">
            <ConnectionPanel :settings="settings" :busy="busy" @save="saveConnection" @test="testConnection" />
            <Form @submit.prevent>
                <FormGroup title="Homey Flow">
                    <p class="description">{{ t('flowHelp') }}</p>
                    <p class="description">{{ t('advancedHelp') }}</p>
                    <pre dir="ltr" :class="$style.example">{{ example }}</pre>
                    <p class="description">{{ t('privacy') }}</p>
                </FormGroup>
            </Form>
        </template>
    </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { api } from '@/api';
import { ConnectionPanel, Top, Form, FormGroup, ButtonTransparent } from '@/components';
import { t } from '@/i18n';
import { useJev } from '@/useJev';
import type { Settings } from '../../src/types';

const example = t('example');

const {settings, busy, error, notice, run, reload} = useJev();

onMounted(async () => { await reload(); });

async function saveConnection(value: Settings & {apiKey: string; clearApiKey: boolean}): Promise<void> {
    await run(async () => {
        settings.value = await api.saveSettings(value);
        notice.value = t('saved');
    });
}

async function testConnection(): Promise<void> {
    await run(async () => {
        const result = await api.testConnection();
        notice.value = `${t('connectionOk')} ${result.model}.`;
    });
}
</script>

<style module>
.example { white-space: pre-wrap; overflow-wrap: anywhere; font-size: var(--homey-font-size-small); user-select: text; }
</style>
