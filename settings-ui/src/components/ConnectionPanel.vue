<template>
    <details class="panel" :open="!settings.hasApiKey">
        <summary>{{ t('connection') }} <span class="muted">{{ settings.model }}</span></summary>
        <form class="stack" @submit.prevent="emit('save', { ...form })">
            <label>{{ t('apiKey') }}
                <input v-model="form.apiKey" type="password" autocomplete="new-password" :disabled="busy" maxlength="512">
                <small>{{ t(settings.hasApiKey ? 'keySaved' : 'keyMissing') }}</small>
            </label>
            <label v-if="settings.hasApiKey" class="check"><input v-model="form.clearApiKey" type="checkbox" :disabled="busy">{{ t('clearKey') }}</label>
            <div class="columns">
                <label>{{ t('model') }}<input v-model="form.model" required pattern="jev-[a-zA-Z0-9.\-]+" :disabled="busy"></label>
                <label>{{ t('timeout') }}<input v-model.number="form.timeoutSeconds" type="number" min="1" max="30" required :disabled="busy"></label>
                <label>{{ t('callLimit') }}<input v-model.number="form.maxCallsPerMinute" type="number" min="1" max="120" required :disabled="busy"></label>
            </div>
            <div class="actions">
                <button class="primary" :disabled="busy">{{ t('saveConnection') }}</button>
                <button type="button" :disabled="busy || !settings.hasApiKey" @click="emit('test')">{{ t('testConnection') }}</button>
            </div>
            <small>{{ t('billable') }}</small>
        </form>
    </details>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { PublicSettings } from '@/api';
import { t } from '@/i18n';
import type { Settings } from '../../../src/types';

const emit = defineEmits<{ save: [value: Settings & {apiKey: string; clearApiKey: boolean}]; test: [] }>();
const props = defineProps<{ readonly settings: PublicSettings; readonly busy: boolean }>();

const form = reactive({...props.settings, apiKey: '', clearApiKey: false});

watch(() => props.settings, value => Object.assign(form, value, {apiKey: '', clearApiKey: false}));
</script>
