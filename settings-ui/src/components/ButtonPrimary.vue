<template>
    <button class="homey-button-primary-full" :class="{'is-loading': isLoading}" :disabled="disabled" :type="type ?? 'button'">
        {{ label }}
    </button>
</template>

<script setup lang="ts">
defineProps<{
    readonly disabled?: boolean;
    readonly isLoading?: boolean;
    readonly label: string;
    readonly type?: 'button' | 'submit';
}>();
</script>
