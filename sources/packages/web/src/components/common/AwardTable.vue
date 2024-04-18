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
import { AWARDS, AwardDetail } from "@/constants/award-constants";

export default defineComponent({
  props: {
    awardDetails: {
      type: Object as PropType<Record<string, string | number | Date>>,
      required: true,
      default: {} as Record<string, string | number | Date>,
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
      AWARDS.filter(
        (award) => award.offeringIntensity === props.offeringIntensity,
      ),
    );

    const getAwardValue = (awardType: string): string | number | Date => {
      const awardValue =
        props.awardDetails[`${props.identifier}${awardType.toLowerCase()}`];
      // If the award is defined but no values are present it means that a receipt value is missing.
      if (awardValue === null) {
        return "-";
      }
      // If the award in not defined at all it means that the award is not eligible and it was not
      // part of the disbursement calculations output.
      return awardValue ?? "(Not eligible)";
    };

    return {
      getAwardValue,
      awards,
    };
  },
});
</script>
