<template>
    <div :class="$style.result">
        <div class="sectionTop">
            <strong>{{ result.label ? (result.type === 'noul' && (result.label === 'yes' || result.label === 'no') ? t(result.label) : result.label) : '—' }}</strong>
            <span :class="['badge', { success: result.status === 'accepted' }]">{{ t(result.status === 'cooldown' ? 'cooldownStatus' : result.status) }}</span>
        </div>
        <p v-if="result.status !== 'accepted'">{{ result.error || t('notAccepted') }}</p>
        <dl :class="$style.metrics">
            <div v-if="result.confidence !== null"><dt>{{ t('confidence') }}</dt><dd>{{ format(result.confidence) }}</dd></div>
            <div v-if="result.probability !== null"><dt>{{ t('probability') }}</dt><dd>{{ format(result.probability) }}</dd></div>
            <div><dt>{{ t('tokens') }}</dt><dd>{{ result.inputTokens }}</dd></div>
            <div><dt>{{ t('model') }}</dt><dd>{{ result.model }}</dd></div>
        </dl>
        <small>{{ new Date(result.startedAt).toLocaleString() }} · {{ result.durationMs }} ms</small>
    </div>
</template>

<script setup lang="ts">
import { t } from '@/i18n';
import type { Evaluation } from '../../../src/types';

defineProps<{readonly result: Evaluation}>();

function format(value: number): string {
    return `${Math.round(value * 100)}%`;
}
</script>

<style module>
.result { display: grid; gap: 12px; font-variant-numeric: tabular-nums; }
.metrics { display: flex; flex-wrap: wrap; gap: 16px 28px; margin: 0; }
.metrics dt { color: var(--muted); font-size: 12px; }
.metrics dd { margin: 4px 0 0; font-size: 14px; }
</style>
