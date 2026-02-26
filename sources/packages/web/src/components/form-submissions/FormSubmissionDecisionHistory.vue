<template>
  <span
    v-if="decisionHistory?.length"
    class="category-header-medium brand-gray-text"
    >Decision history</span
  >
  <v-timeline density="compact" side="end" class="mt-4">
    <v-timeline-item
      v-for="history in decisionHistory"
      :key="history.id"
      :dot-color="history.statusColor"
      size="x-small"
    >
      <v-sheet color="grey-lighten-4 p-3" rounded class="content-footer">
        <h4 class="text-body-2">
          <strong class="secondary-color-light">
            Saved as {{ history.decisionStatus }} on
            {{ getISODateHourMinuteString(history.decisionDate) }}
            by
            {{ history.decisionBy }}
          </strong>
        </h4>
        <p class="secondary-color-light">
          {{ history.decisionNoteDescription }}
        </p>
      </v-sheet>
    </v-timeline-item>
  </v-timeline>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { DecisionHistory } from "@/types";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    decisionHistory: {
      type: Array as PropType<DecisionHistory[]>,
      required: true,
    },
  },
  setup() {
    const { getISODateHourMinuteString } = useFormatters();
    return { getISODateHourMinuteString };
  },
});
</script>
