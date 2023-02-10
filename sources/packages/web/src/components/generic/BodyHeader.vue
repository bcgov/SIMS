<template>
  <v-row no-gutters>
    <v-col>
      <h2 class="category-header-large color-blue">{{ fullTitleMessage }}</h2>
      <slot name="status-chip"></slot>
    </v-col>
    <v-col>
      <slot name="actions"></slot>
    </v-col>
  </v-row>
  <v-row class="mb-2">
    <v-col>
      <slot name="subtitle">{{ subTitle }}</slot>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: false,
    },
    recordsCount: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const fullTitleMessage = computed(() => {
      if (props.recordsCount) {
        return `${props.title} (${props.recordsCount})`;
      }
      return props.title;
    });
    return { fullTitleMessage };
  },
});
</script>
