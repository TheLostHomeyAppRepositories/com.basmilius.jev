<template>
    <form class="panel stack" @submit.prevent="emit('save')">
        <div class="sectionTop"><h2>{{ decision.name || t(decision.type) }}</h2><span class="badge">{{ t(decision.type) }}</span></div>
        <fieldset :disabled="busy" class="stack">
            <label>{{ t('name') }}<input v-model="decision.name" required maxlength="100"></label>
            <label>{{ t('question') }}<textarea v-model="decision.question" rows="2" required maxlength="8000" /></label>
            <label>{{ t('background') }}<textarea v-model="decision.background" rows="2" maxlength="16000" /><small>{{ t('backgroundHelp') }}</small></label>

            <section v-if="decision.type === 'choice'" class="stack">
                <h3>{{ t('options') }}</h3>
                <div v-for="option in decision.options" :key="option.id" :class="$style.option">
                    <div class="columns">
                        <label>{{ t('optionName') }}<input v-model="option.name" required maxlength="100"></label>
                        <label>{{ t('description') }}<input v-model="option.description" maxlength="2000"></label>
                    </div>
                    <button type="button" :disabled="decision.options.length <= 2" @click="removeOption(option.id)">{{ t('removeOption') }}</button>
                </div>
                <button type="button" :disabled="decision.options.length >= 255" @click="addOption">{{ t('addOption') }}</button>
                <label>{{ t('threshold') }}<input v-model.number="decision.minConfidence" type="number" step="0.01" min="0" max="1" required><small>{{ t('thresholdHelp') }}</small></label>
            </section>
            <section v-else class="stack">
                <div class="columns">
                    <label>{{ t('noThreshold') }}<input v-model.number="decision.noThreshold" type="number" step="0.01" min="0" max="1" required></label>
                    <label>{{ t('yesThreshold') }}<input v-model.number="decision.yesThreshold" type="number" step="0.01" min="0" max="1" required></label>
                </div>
                <small>{{ t('noulHelp') }}</small>
            </section>
            <div class="columns">
                <label>{{ t('cooldown') }}<input v-model.number="decision.cooldownSeconds" type="number" min="0" max="86400" required></label>
                <label>{{ t('maxAge') }}<input v-model.number="decision.maxAgeSeconds" type="number" min="1" max="86400" required></label>
            </div>
        </fieldset>
        <div class="actions">
            <button class="primary" :disabled="busy || !dirty">{{ t('saveDecision') }}</button>
            <button v-if="decision.revision" type="button" class="danger" :disabled="busy" @click="emit('remove')">{{ t('deleteDecision') }}</button>
        </div>
    </form>
</template>

<script setup lang="ts">
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

<style module>
.option { padding: 16px; border: 1px solid var(--border); border-radius: 10px; display: grid; gap: 12px; }
</style>
