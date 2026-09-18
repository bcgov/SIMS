<template>
  <v-tooltip :max-width="maxWidth">
    <template #activator="{ props }">
      <v-icon
        icon="fa:fas fa-circle-question"
        class="mx-1 mt-n1"
        color="secondary"
        size="16"
        v-bind="props"
      />
    </template>
    <slot></slot>
  </v-tooltip>
</template>
<script setup lang="ts">
defineProps<{ maxWidth?: number }>();
</script>
