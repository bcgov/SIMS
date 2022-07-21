<template>
  <v-row no-gutters>
    <v-col class="category-header-large color-blue" order="1">
      {{ fullTitleMessage }}
    </v-col>
    <v-col class="ml-2" order="2">
      <slot name="status-chip"></slot>
    </v-col>
    <v-col order="3">
      <div>
        <slot name="actions"></slot>
      </div>
      <div class="float-right">
        <slot name="actions-align-end"></slot>
      </div>
    </v-col>
  </v-row>
  <v-row class="mb-4">
    <v-col>
      {{ subTitle }}
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed } from "vue";
export default {
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
};
</script>
