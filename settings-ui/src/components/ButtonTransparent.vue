<template>
    <button class="homey-button-transparent" :disabled="disabled" type="button">{{ label }}</button>
</template>

<script setup lang="ts">
defineProps<{readonly disabled?: boolean; readonly label: string}>();
</script>
