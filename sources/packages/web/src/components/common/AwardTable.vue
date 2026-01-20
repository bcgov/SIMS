<template>
  <v-table class="bordered">
    <thead>
      <tr>
        <th scope="col" class="text-left">Loan/grant type</th>
        <th scope="col" class="text-left">{{ awardHeader }}</th>
        <th v-if="isFinal" scope="col" class="text-left">Adjustments</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="award in awards" :key="award.awardType">
        <td>
          {{ award.awardTypeDisplay }}
          <tooltip-icon>{{ award.description }}</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue(award.awardType) }}
        </td>
        <td v-if="isFinal">
          <assessment-award-adjustments
            :amounts="getAdjustmentAmounts(award.awardType)"
          />
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
<script lang="ts">
import { PropType, defineComponent, computed } from "vue";
import { OfferingIntensity } from "@/types";
import { AWARDS, AwardDetail } from "@/constants/award-constants";
import {
  AwardAdjustmentAmounts,
  AwardTableType,
  DynamicAwardValue,
} from "@/services/http/dto";
import { useFormatters } from "@/composables";
import AssessmentAwardAdjustments from "@/components/common/students/applicationDetails/AssessmentAwardAdjustments.vue";

/**
 * Suffixes for dynamic fields to track subtracted amounts.
 */
const DISBURSED_SUBTRACTED_SUFFIX = "DisbursedAmountSubtracted";
const OVERAWARD_SUBTRACTED_SUFFIX = "OverawardAmountSubtracted";
const RESTRICTION_SUBTRACTED_SUFFIX = "RestrictionAmountSubtracted";

export default defineComponent({
  components: { AssessmentAwardAdjustments },
  props: {
    awardDetails: {
      type: Object as PropType<DynamicAwardValue>,
      required: true,
      default: {} as DynamicAwardValue,
    },
    identifier: {
      type: String,
      required: true,
    },
    offeringIntensity: {
      type: String as PropType<OfferingIntensity>,
      required: true,
    },
    awardTableType: {
      type: String as PropType<AwardTableType>,
      required: true,
    },
  },
  setup(props) {
    const awards = computed<AwardDetail[]>(() =>
      AWARDS.filter(
        (award) => award.offeringIntensity === props.offeringIntensity,
      ),
    );
    const { currencyFormatter } = useFormatters();

    const getAwardValue = (awardType: string): string | number | Date => {
      const awardValue = props.awardDetails[
        `${props.identifier}${awardType.toLowerCase()}`
      ] as number;
      // If the award is defined but no values are present it means that a receipt value is missing.
      if (awardValue === null) {
        return "-";
      }
      // If the award in not defined at all it means that the award is not eligible and it was not
      // part of the disbursement calculations output.
      return currencyFormatter(awardValue, "(Not eligible)");
    };

    const getAdjustmentAmounts = (
      awardType: string,
    ): AwardAdjustmentAmounts => {
      const disbursementValueKey = `${props.identifier}${awardType.toLowerCase()}`;
      const disbursedAmountSubtracted =
        (props.awardDetails[
          `${disbursementValueKey}${DISBURSED_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      const overawardAmountSubtracted =
        (props.awardDetails[
          `${disbursementValueKey}${OVERAWARD_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      const restrictionAmountSubtracted =
        (props.awardDetails[
          `${disbursementValueKey}${RESTRICTION_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      return {
        disbursedAmountSubtracted,
        overawardAmountSubtracted,
        restrictionAmountSubtracted,
      };
    };

    const isFinal = computed(() => {
      return props.awardTableType === AwardTableType.Final;
    });

    const awardHeader = computed(() => {
      return isFinal.value ? "Award" : "Estimated award";
    });

    return {
      getAwardValue,
      awards,
      awardHeader,
      isFinal,
      getAdjustmentAmounts,
    };
  },
});
</script>
