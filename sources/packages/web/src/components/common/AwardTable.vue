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

interface AwardTableModel {
  awardType: string;
  description: string;
}

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
    const fullTimeAwards: AwardTableModel[] = [
      {
        awardType: "CSLF",
        description: "Canada Student Loan for Full-time Studies",
      },
      {
        awardType: "CSGP",
        description:
          "Canada Student Grant for Student with Permanent Disability",
      },
      {
        awardType: "CSGD",
        description: "Canada Student Grant for Students with Dependents",
      },
      {
        awardType: "CSGF",
        description: "Canada Student Grant for Full-time Studies",
      },
      {
        awardType: "CSGT",
        description: "Canada Student Grant for Full-time Top-up",
      },
      {
        awardType: "BCSL",
        description: "B.C. Student Loan",
      },
      {
        awardType: "BCAG",
        description: "B.C. Access Grant",
      },
      {
        awardType: "BGPD",
        description: "B.C. Permanent Disability Grant",
      },
      {
        awardType: "SBSD",
        description: "B.C. Supplemental Bursary with Disabilities",
      },
    ];

    const partTimeAwards: AwardTableModel[] = [
      {
        awardType: "CSLP",
        description: "Canada Student Loan for Part-time Studies",
      },
      {
        awardType: "CSGP",
        description:
          "Canada Student Grant for Student with Permanent Disability",
      },
      {
        awardType: "CSPT",
        description: "Canada Student Grant for Part-time Studies",
      },
      {
        awardType: "CSGD",
        description: "Canada Student Grant for Students with Dependents",
      },
      {
        awardType: "BCAG",
        description: "B.C. Access Grant",
      },
      {
        awardType: "SBSD",
        description: "B.C. Supplemental Bursary with Disabilities",
      },
    ];

    const awards = computed<AwardTableModel[]>(() =>
      props.offeringIntensity === OfferingIntensity.fullTime
        ? fullTimeAwards
        : partTimeAwards,
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
