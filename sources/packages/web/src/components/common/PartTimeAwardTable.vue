<template>
  <v-table class="bordered">
    <thead>
      <tr>
        <th scope="col" class="text-left">Loan/grant type</th>
        <th scope="col" class="text-left">Estimated award</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          CSLP
          <tooltip-icon>Canada Student Loan for Part-time Studies</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue("cslp") }}
        </td>
      </tr>
      <tr>
        <td>
          CSGP
          <tooltip-icon
            >Canada Student Grant for Student with Permanent
            Disability</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("csgp") }}
        </td>
      </tr>
      <tr>
        <td>
          CSPT
          <tooltip-icon
            >Canada Student Grant for Part-time Studies</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("csgd") }}
        </td>
      </tr>
      <tr>
        <td>
          CSGD
          <tooltip-icon
            >Canada Student Grant for Students with Dependents</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("csgd") }}
        </td>
      </tr>
      <tr>
        <td>
          BCAG
          <tooltip-icon>B.C. Access Grant</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue("bcag") }}
        </td>
      </tr>
      <tr>
        <td>
          SBSD
          <tooltip-icon
            >B.C. Supplemental Bursary with Disabilities</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("sbsd") }}
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
<script lang="ts">
import { PropType, defineComponent } from "vue";

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
    };
  },
});
</script>
