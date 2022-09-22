<template>
  <full-time-award-table
    v-if="offeringIntensity === OfferingIntensity.fullTime"
    :awardDetails="awardDetails"
    :identifier="identifier"
  />
  <part-time-award-table
    v-else
    :awardDetails="awardDetails"
    :identifier="identifier"
  />
</template>
<script lang="ts">
import { PropType, defineComponent } from "vue";
import { OfferingIntensity } from "@/types";
import FullTimeAwardTable from "@/components/common/FullTimeAwardTable.vue";
import PartTimeAwardTable from "@/components/common/PartTimeAwardTable.vue";

export default defineComponent({
  components: { FullTimeAwardTable, PartTimeAwardTable },
  props: {
    awardDetails: {
      type: Object as PropType<Record<string, string | number>>,
      required: true,
      default: {} as Record<string, string | number>,
    },
    identifier: {
      type: String,
      required: true,
    },
    offeringIntensity: {
      type: String as PropType<OfferingIntensity>,
      required: true,
    },
  },
  setup(props) {
    const getAwardValue = (awardType: string): string | number => {
      return (
        props.awardDetails[`${props.identifier}${awardType}`] ??
        "(Not eligible)"
      );
    };

    return {
      getAwardValue,
      OfferingIntensity,
    };
  },
});
</script>
