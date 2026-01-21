<template>
  <div>
    <chip-tag
      v-if="amounts.disbursedAmountSubtracted > 0"
      color="error"
      label="Funded"
    />
    <chip-tag
      v-if="amounts.overawardAmountSubtracted > 0"
      color="error"
      label="Overawards"
    />
    <chip-tag
      v-else-if="amounts.overawardAmountSubtracted < 0"
      color="success"
      label="Overawards"
    />
    <chip-tag
      v-if="amounts.restrictionAmountSubtracted > 0"
      color="error"
      label="Restriction"
    />
  </div>
</template>
<script lang="ts">
import ChipTag from "@/components/generic/ChipTag.vue";
import { AwardAdjustmentAmounts } from "@/services/http/dto";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  components: { ChipTag },
  props: {
    amounts: {
      type: Object as PropType<AwardAdjustmentAmounts>,
      required: true,
    },
  },
});
</script>
