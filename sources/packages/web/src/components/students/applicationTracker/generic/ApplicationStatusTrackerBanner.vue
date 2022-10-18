<template>
  <v-alert
    variant="tonal"
    class="application-tracker-alert mt-3"
    :class="backgroundColor"
    :color="backgroundColor"
  >
    <template #prepend>
      <v-icon class="mt-1" :icon="icon" :size="20" :color="iconColor" />
    </template>
    <template #title>
      <h3 class="category-header-medium mb-3 label">
        {{ label }}
      </h3>
    </template>
    <span class="label-value-normal">
      <slot name="content">
        <v-row>
          <v-col md="auto">
            <span>{{ content }}</span>
          </v-col>
          <v-col offset-md="5" class="mt-n8">
            <slot name="image"></slot>
          </v-col>
        </v-row>
      </slot>
    </span>
    <div class="my-3">
      <slot name="actions"></slot>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    label: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
    icon: {
      type: String,
      required: true,
    },
    backgroundColor: {
      type: String,
      required: false,
      default: "white",
    },
    iconColor: {
      type: String,
      required: false,
      default: "black",
    },
  },
});
</script>
