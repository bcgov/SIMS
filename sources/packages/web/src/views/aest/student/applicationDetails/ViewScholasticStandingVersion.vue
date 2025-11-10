<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        sub-title="View Submission"
        :route-location="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY_DETAILS_VERSION,
          params: {
            studentId,
            applicationId,
            versionApplicationId,
          },
        }"
      />
    </template>
    <scholastic-standing-form
      :scholastic-standing-id="scholasticStandingId"
      :read-only="true"
      :show-footer="true"
      :show-complete-info="true"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    versionApplicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      AESTRoutesConst,
    };
  },
};
</script>
