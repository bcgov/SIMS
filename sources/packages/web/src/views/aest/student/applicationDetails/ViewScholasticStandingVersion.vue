<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        sub-title="View Submission"
        :route-location="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
          params: {
            studentId,
            applicationId,
            versionApplicationId,
          },
        }"
      />
    </template>
    <template #alerts>
      <scholastic-standing-reversal-banner v-if="hasReversal" />
    </template>
    <scholastic-standing-form
      :scholastic-standing-id="scholasticStandingId"
      :read-only="true"
      :show-footer="true"
      :show-complete-info="true"
      @data-loaded="dataLoaded"
    />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import ScholasticStandingReversalBanner from "@/components/common/students/applicationDetails/ScholasticStandingReversalBanner.vue";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";
import { computed, ref } from "vue";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
    ScholasticStandingReversalBanner,
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
    const scholasticStandingDetails = ref(
      {} as ScholasticStandingSubmittedDetailsAPIOutDTO,
    );

    const dataLoaded = (data: ScholasticStandingSubmittedDetailsAPIOutDTO) => {
      scholasticStandingDetails.value = data;
    };

    const hasReversal = computed(
      () => !!scholasticStandingDetails.value.reversalDate,
    );
    return {
      AESTRoutesConst,
      dataLoaded,
      hasReversal,
    };
  },
};
</script>
