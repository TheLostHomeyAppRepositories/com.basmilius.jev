<template>
    <main>
        <Top title="Jev" :subtitle="t('introDetail')" />
        <p v-if="error" class="feedbackError" role="alert">{{ error }} <ButtonTransparent v-if="!state" :disabled="busy" :label="t('retry')" @click="reload" /></p>
        <p v-if="notice" class="feedbackSuccess" role="status">{{ notice }}</p>
        <p v-if="!state && busy" role="status">{{ t('loading') }}</p>
        <template v-if="settings && state">
            <ConnectionPanel :settings="settings" :busy="busy" @save="saveConnection" @test="testConnection" />
            <Form @submit.prevent>
                <FormGroup :title="t('decisions')">
                    <ButtonPrimary :disabled="busy" :label="t('newChoice')" @click="newDecision('choice')" />
                    <ButtonTransparent :disabled="busy" :label="t('newNoul')" @click="newDecision('noul')" />
                    <div v-if="!state.decisions.length" class="homey-form-group">
                        <p class="description">{{ t('emptyDetail') }}</p>
                    </div>
                    <div v-else class="homey-form-group decisionList">
                        <button v-for="decision in state.decisions" :key="decision.id" type="button" :disabled="busy" class="homey-button-transparent decisionButton" :aria-pressed="draft?.id === decision.id" @click="choose(decision)">
                            <span>{{ decision.name }}</span><small>{{ t(decision.type) }}</small>
                        </button>
                    </div>
                    <p v-if="state.decisions.length && !draft" class="description">{{ t('selectDecision') }}</p>
                    <ButtonTransparent :disabled="busy" :label="t('refresh')" @click="reload" />
                </FormGroup>
            </Form>

            <template v-if="draft">
                <DecisionEditor v-model="draft" :busy="busy" :dirty="dirty" @save="save" @remove="deleteDecision" />
                <Form @submit.prevent="test(context)">
                    <FormGroup :title="t('testTitle')">
                        <FormTextarea v-model="context" :label="t('context')" :rows="4" maxlength="64000" required :placeholder="t('contextPlaceholder')" :disabled="busy" />
                        <p class="description">{{ t('testHelp') }}</p>
                        <ButtonPrimary type="submit" :is-loading="busy" :label="t('test')" :disabled="busy || dirty || !settings.hasApiKey || !context.trim()" />
                        <p v-if="dirty" class="description">{{ t('saveFirst') }}</p>
                        <div v-if="testResult && !dirty" class="homey-form-group" aria-live="polite"><EvaluationResult :result="testResult" /></div>
                    </FormGroup>
                </Form>
            </template>

            <Form @submit.prevent>
                <FormGroup title="Homey Flow">
                    <p class="description">{{ t('flowHelp') }}</p>
                    <p class="description">{{ t('privacy') }}</p>
                </FormGroup>
                <FormGroup :title="t('history')">
                    <ButtonTransparent :disabled="busy" :label="t('refresh')" @click="reload" />
                    <p v-if="!state.history.length" class="description">{{ t('noHistory') }}</p>
                    <details v-for="entry in state.history" :key="entry.id" class="homey-form-group historyItem">
                        <summary><span>{{ entry.decisionName }}</span><small>{{ entry.test ? t('testBadge') + ' · ' : '' }}{{ t(entry.status === 'cooldown' ? 'cooldownStatus' : entry.status) }}</small></summary>
                        <EvaluationResult :result="entry" />
                    </details>
                </FormGroup>
            </Form>
        </template>
    </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import { ConnectionPanel, DecisionEditor, EvaluationResult, Top, Form, FormGroup, FormTextarea, ButtonPrimary, ButtonTransparent } from '@/components';
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
