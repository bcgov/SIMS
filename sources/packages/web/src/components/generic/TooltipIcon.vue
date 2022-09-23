<template>
  <v-tooltip>
    <template #activator="{ props }">
      <v-icon
        icon="fa:fas fa-circle-question"
        class="mx-2 mt-n1"
        color="secondary"
        size="16"
        v-bind="props"
      />
    </template>
    <slot></slot>
  </v-tooltip>
</template>
