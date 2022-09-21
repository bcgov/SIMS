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
        <td>Canada Student Loan</td>
        <td>
          {{ getAwardValue("cslf") }}
        </td>
      </tr>
      <tr>
        <td>B.C. Student Loan</td>
        <td>
          {{ getAwardValue("bcsl") }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-P
          <tooltip-icon
            >Canada Student Grant with Permanent Disability.</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("csgp") }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-D
          <tooltip-icon>Canada Student Grant with dependant(s).</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue("csgd") }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-F
          <tooltip-icon
            >Canada Student Grant for Full time studies.</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("csgf") }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-TU
          <tooltip-icon>Canada Student Grant for Top-up.</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue("csgt") }}
        </td>
      </tr>
      <tr>
        <td>
          BCAG
          <tooltip-icon>British Colombia Access Grant.</tooltip-icon>
        </td>
        <td>
          {{ getAwardValue("bcag") }}
        </td>
      </tr>
      <tr>
        <td>
          BCAG-D
          <tooltip-icon
            >British Colombia Access Grant with disabilities.</tooltip-icon
          >
        </td>
        <td>
          {{ getAwardValue("bcagd") }}
        </td>
      </tr>
      <tr>
        <td>
          SBSD
          <tooltip-icon
            >British Colombia Supplemental Bursary with
            Disabilities.</tooltip-icon
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
