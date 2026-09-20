<template>
    <div class="homey-form-group">
        <label class="homey-form-label" :for="id">{{ label }}</label>
        <textarea v-bind="$attrs" v-model="value" class="homey-form-textarea" :id="id" :rows="rows ?? 4" :disabled="disabled" />
        <slot />
    </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineOptions({inheritAttrs: false});
const value = defineModel<string>({required: true});
defineProps<{readonly label: string; readonly rows?: number; readonly disabled?: boolean}>();

const id = useId();
</script>
