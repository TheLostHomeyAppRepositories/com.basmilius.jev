<template>
    <div class="homey-form-group">
        <label class="homey-form-label" :for="id">{{ label }}</label>
        <input v-bind="$attrs" v-model="value" class="homey-form-input" :id="id" :type="type ?? 'text'" :disabled="disabled">
        <slot />
    </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue';

defineOptions({inheritAttrs: false});
const value = defineModel<T>({required: true});
defineProps<{readonly label: string; readonly type?: string; readonly disabled?: boolean}>();

const id = useId();
</script>
