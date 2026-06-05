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
      <h3 class="category-header-medium mb-3 label my-0">
        {{ label }}
      </h3>
    </template>
    <span class="label-value-normal m-0 p-0">
      <slot name="content">
        <v-row class="m-0 p-0" no-gutters compact>
          <v-col md="auto">
            <span>{{ content }}</span>
          </v-col>
          <v-col offset-md="5">
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
      default: "",
    },
    content: {
      type: String,
      required: false,
      default: "",
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
