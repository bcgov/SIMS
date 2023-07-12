<template>
  <v-row no-gutters>
    <v-col cols="auto" class="mr-2">
      <h2 class="category-header-large color-blue">{{ fullTitleMessage }}</h2>
    </v-col>
    <v-col cols="auto" class="mr-2">
      <slot name="status-chip"></slot>
    </v-col>
    <v-col>
      <slot name="actions"></slot>
    </v-col>
  </v-row>
  <v-row no-gutters class="mb-2">
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
  setup(props) {
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
