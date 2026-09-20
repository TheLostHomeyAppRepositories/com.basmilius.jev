<template>
    <Form @submit.prevent="emit('save')">
        <FormGroup :title="decision.name || t(decision.type)" :disabled="busy">
            <FormInput v-model="decision.name" :label="t('name')" required maxlength="100" />
            <FormTextarea v-model="decision.question" :label="t('question')" :rows="2" required maxlength="8000" />
            <FormTextarea v-model="decision.background" :label="t('background')" :rows="2" maxlength="16000">
                <p class="description">{{ t('backgroundHelp') }}</p>
            </FormTextarea>
        </FormGroup>

        <FormGroup v-if="decision.type === 'choice'" :title="t('options')" :disabled="busy">
            <div v-for="option in decision.options" :key="option.id" class="optionGroup">
                <FormInput v-model="option.name" :label="t('optionName')" required maxlength="100" />
                <FormInput v-model="option.description" :label="t('description')" maxlength="2000" />
                <ButtonTransparent :label="t('removeOption')" :disabled="decision.options.length <= 2" @click="removeOption(option.id)" />
            </div>
            <ButtonTransparent :label="t('addOption')" :disabled="decision.options.length >= 255" @click="addOption" />
            <FormInput v-model="decision.minConfidence" type="number" :label="t('threshold')" step="0.01" min="0" max="1" required>
                <p class="description">{{ t('thresholdHelp') }}</p>
            </FormInput>
        </FormGroup>
        <FormGroup v-else :title="t('noul')" :disabled="busy">
            <FormInput v-model="decision.noThreshold" type="number" :label="t('noThreshold')" step="0.01" min="0" max="1" required />
            <FormInput v-model="decision.yesThreshold" type="number" :label="t('yesThreshold')" step="0.01" min="0" max="1" required />
            <p class="description">{{ t('noulHelp') }}</p>
        </FormGroup>

        <FormGroup :title="t('maxAge')" :disabled="busy">
            <FormInput v-model="decision.cooldownSeconds" type="number" :label="t('cooldown')" min="0" max="86400" required />
            <FormInput v-model="decision.maxAgeSeconds" type="number" :label="t('maxAge')" min="1" max="86400" required />
            <ButtonPrimary type="submit" :label="t('saveDecision')" :disabled="busy || !dirty" />
            <ButtonTransparent v-if="decision.revision" :label="t('deleteDecision')" :disabled="busy" @click="emit('remove')" />
        </FormGroup>
    </Form>
</template>

<script setup lang="ts">
import Form from './Form.vue';
import FormGroup from './FormGroup.vue';
import FormInput from './FormInput.vue';
import FormTextarea from './FormTextarea.vue';
import ButtonPrimary from './ButtonPrimary.vue';
import ButtonTransparent from './ButtonTransparent.vue';
import type { EditableDecision } from '@/api';
import { t } from '@/i18n';

const emit = defineEmits<{ save: []; remove: [] }>();
const decision = defineModel<EditableDecision>({required: true});
defineProps<{readonly busy: boolean; readonly dirty: boolean}>();

function addOption(): void {
    decision.value.options.push({id: crypto.randomUUID(), name: '', description: ''});
}

function removeOption(id: string): void {
    decision.value.options = decision.value.options.filter(option => option.id !== id);
}
</script>
