<template>
    <main class="app">
        <header class="hero"><span class="wordmark">Jev</span><h1>{{ t('intro') }}</h1><p>{{ t('introDetail') }}</p></header>
        <p v-if="error" class="message error" role="alert">{{ error }} <button v-if="!state" :disabled="busy" @click="reload">{{ t('retry') }}</button></p>
        <p v-if="notice" class="message" role="status">{{ notice }}</p>
        <p v-if="!state && busy" role="status">{{ t('loading') }}</p>
        <template v-if="settings && state">
            <ConnectionPanel :settings="settings" :busy="busy" @save="saveConnection" @test="testConnection" />
            <section class="panel stack">
                <div class="sectionTop"><h2>{{ t('decisions') }}</h2><button :disabled="busy" @click="reload">{{ t('refresh') }}</button></div>
                <div class="actions"><button :disabled="busy" @click="newDecision('choice')">+ {{ t('newChoice') }}</button><button :disabled="busy" @click="newDecision('noul')">+ {{ t('newNoul') }}</button></div>
                <div v-if="!state.decisions.length" class="empty"><h3>{{ t('empty') }}</h3><p>{{ t('emptyDetail') }}</p></div>
                <div v-else class="decisionList">
                    <button v-for="decision in state.decisions" :key="decision.id" :disabled="busy" :class="['decisionButton', { selected: draft?.id === decision.id }]" :aria-pressed="draft?.id === decision.id" @click="choose(decision)">
                        <span>{{ decision.name }}</span><small>{{ t(decision.type) }}</small>
                    </button>
                </div>
                <p v-if="state.decisions.length && !draft" class="muted">{{ t('selectDecision') }}</p>
            </section>

            <template v-if="draft">
                <DecisionEditor v-model="draft" :busy="busy" :dirty="dirty" @save="save" @remove="deleteDecision" />
                <section class="panel stack">
                    <h2>{{ t('testTitle') }}</h2>
                    <form class="stack" @submit.prevent="test(context)">
                        <label>{{ t('context') }}<textarea v-model="context" rows="4" maxlength="64000" required :placeholder="t('contextPlaceholder')" :disabled="busy" /></label>
                        <small>{{ t('testHelp') }}</small>
                        <button class="primary" :disabled="busy || dirty || !settings.hasApiKey || !context.trim()">{{ busy ? t('loading') : t('test') }}</button>
                        <small v-if="dirty">{{ t('saveFirst') }}</small>
                    </form>
                    <div v-if="testResult && !dirty" class="testResult" aria-live="polite"><h3>{{ t('preview') }}</h3><EvaluationResult :result="testResult" /></div>
                </section>
            </template>

            <section class="panel stack"><h2>Homey Flow</h2><p>{{ t('flowHelp') }}</p><small>{{ t('privacy') }}</small></section>
            <section class="panel stack">
                <div class="sectionTop"><h2>{{ t('history') }}</h2><button :disabled="busy" @click="reload">{{ t('refresh') }}</button></div>
                <p v-if="!state.history.length" class="muted">{{ t('noHistory') }}</p>
                <details v-for="entry in state.history" :key="entry.id" class="historyItem">
                    <summary><span>{{ entry.decisionName }}</span><small>{{ entry.test ? t('testBadge') + ' · ' : '' }}{{ t(entry.status === 'cooldown' ? 'cooldownStatus' : entry.status) }}</small></summary>
                    <EvaluationResult :result="entry" />
                </details>
            </section>
        </template>
    </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import { ConnectionPanel, DecisionEditor, EvaluationResult } from '@/components';
import { t } from '@/i18n';
import { useJev } from '@/useJev';
import type { Decision, Settings } from '../../src/types';

const context = ref('');

const {settings, state, draft, busy, error, notice, dirty, testResult, run, reload, select, create, save, remove, test} = useJev();

onMounted(async () => { await reload(); });

function choose(decision: Decision): void {
    if (dirty.value && !window.confirm(t('discardConfirm'))) return;
    select(decision);
    context.value = '';
}

function newDecision(type: Decision['type']): void {
    if (dirty.value && !window.confirm(t('discardConfirm'))) return;
    create(type);
    context.value = '';
}

async function deleteDecision(): Promise<void> {
    if (window.confirm(t('deleteConfirm'))) await remove();
}

async function saveConnection(value: Settings & {apiKey: string; clearApiKey: boolean}): Promise<void> {
    await run(async () => {
        settings.value = await api.saveSettings(value);
        state.value = await api.decisions();
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
