<template>
  <div>
    <chip-tag v-if="adjustments.disbursed" color="error" label="Funded" />
    <chip-tag
      v-if="adjustments.positiveOveraward"
      color="error"
      label="Overawards"
    />
    <chip-tag
      v-else-if="adjustments.negativeOveraward"
      color="success"
      label="Overawards"
    />
    <chip-tag
      v-if="adjustments.restriction"
      color="error"
      label="Restriction"
    />
  </div>
</template>
<script lang="ts">
import { AwardAdjustmentType } from "@/types";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    adjustments: {
      type: Object as PropType<AwardAdjustmentType>,
      required: true,
    },
  },
});
</script>
