<template>
    <Form @submit.prevent="emit('save', {...form})">
        <FormGroup :title="t('connection')">
            <FormInput v-model="form.apiKey" type="password" :label="t('apiKey')" autocomplete="new-password" :disabled="busy" maxlength="512">
                <p class="description">{{ t(settings.hasApiKey ? 'keySaved' : 'keyMissing') }}</p>
            </FormInput>
            <label v-if="settings.hasApiKey" class="homey-form-checkbox">
                <input v-model="form.clearApiKey" class="homey-form-checkbox-input" type="checkbox" :disabled="busy">
                <span class="homey-form-checkbox-checkmark" />
                <span class="homey-form-checkbox-text">{{ t('clearKey') }}</span>
            </label>
            <FormInput v-model="form.model" :label="t('model')" required pattern="jev-[a-zA-Z0-9.\-]+" :disabled="busy" />
            <FormInput v-model="form.timeoutSeconds" type="number" :label="t('timeout')" min="1" max="30" required :disabled="busy" />
            <FormInput v-model="form.maxCallsPerMinute" type="number" :label="t('callLimit')" min="1" max="120" required :disabled="busy" />
            <ButtonPrimary type="submit" :label="t('saveConnection')" :disabled="busy" />
            <ButtonTransparent :label="t('testConnection')" :disabled="busy || !settings.hasApiKey" @click="emit('test')" />
            <p class="description">{{ t('billable') }}</p>
        </FormGroup>
    </Form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import Form from './Form.vue';
import FormGroup from './FormGroup.vue';
import FormInput from './FormInput.vue';
import ButtonPrimary from './ButtonPrimary.vue';
import ButtonTransparent from './ButtonTransparent.vue';
import type { PublicSettings } from '@/api';
import { t } from '@/i18n';
import type { Settings } from '../../../src/types';

const emit = defineEmits<{ save: [value: Settings & {apiKey: string; clearApiKey: boolean}]; test: [] }>();
const props = defineProps<{ readonly settings: PublicSettings; readonly busy: boolean }>();

const form = reactive({...props.settings, apiKey: '', clearApiKey: false});

watch(() => props.settings, value => Object.assign(form, value, {apiKey: '', clearApiKey: false}));
</script>
