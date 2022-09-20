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
          {{ awardDetails[`${identifier}cslf`] ?? NOT_ELIGIBLE }}
        </td>
      </tr>
      <tr>
        <td>B.C. Student Loan</td>
        <td>
          {{ awardDetails[`${identifier}bcsl`] ?? NOT_ELIGIBLE }}
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
          {{ awardDetails[`${identifier}csgp`] ?? NOT_ELIGIBLE }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-D
          <tooltip-icon>Canada Student Grant with dependant(s).</tooltip-icon>
        </td>
        <td>
          {{ awardDetails[`${identifier}csgd`] ?? NOT_ELIGIBLE }}
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
          {{ awardDetails[`${identifier}csgf`] ?? NOT_ELIGIBLE }}
        </td>
      </tr>
      <tr>
        <td>
          CSG-TU
          <tooltip-icon>Canada Student Grant for Top-up.</tooltip-icon>
        </td>
        <td>
          {{ awardDetails[`${identifier}csgt`] ?? NOT_ELIGIBLE }}
        </td>
      </tr>
      <tr>
        <td>
          BCAG
          <tooltip-icon>British Colombia Access Grant.</tooltip-icon>
        </td>
        <td>
          {{ awardDetails[`${identifier}bcag`] ?? NOT_ELIGIBLE }}
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
          {{ awardDetails[`${identifier}bcagd`] ?? NOT_ELIGIBLE }}
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
          {{ awardDetails[`${identifier}sbsd`] ?? NOT_ELIGIBLE }}
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
<script lang="ts">
import { DynamicAwardDTO } from "@/services/http/dto";
import { PropType } from "vue";

export default {
  props: {
    awardDetails: {
      type: Object as PropType<DynamicAwardDTO>,
      required: true,
      default: {} as DynamicAwardDTO,
    },
    identifier: {
      type: String,
      required: true,
    },
  },
  setup() {
    const NOT_ELIGIBLE = "(Not eligible)";

    return {
      NOT_ELIGIBLE,
    };
  },
};
</script>
