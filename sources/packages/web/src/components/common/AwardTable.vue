<template>
  <v-table class="bordered">
    <thead>
      <tr>
        <th scope="col" class="text-left">Loan/grant type</th>
        <th scope="col" class="text-left">Estimated award</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="award in awards" :key="award.awardType">
        <td>
          {{ award.awardType }}
          <tooltip-icon>{{ award.description }}</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue(award.awardType) }}
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
<script lang="ts">
import { PropType, defineComponent, computed } from "vue";
import { OfferingIntensity } from "@/types";
import {
  FULL_TIME_AWARDS,
  PART_TIME_AWARDS,
  AwardDetail,
} from "@/constants/award-constants";

export default defineComponent({
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
    const awards = computed<AwardDetail[]>(() =>
      props.offeringIntensity === OfferingIntensity.fullTime
        ? FULL_TIME_AWARDS
        : PART_TIME_AWARDS,
    );

    const getAwardValue = (awardType: string): string | number => {
      return (
        props.awardDetails[`${props.identifier}${awardType.toLowerCase()}`] ??
        "(Not eligible)"
      );
    };

    return {
      getAwardValue,
      awards,
    };
  },
});
</script>
