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
      <scholastic-standing-non-punitive-banner
        v-if="isNonPunitiveWithdrawal"
        class="mt-3"
      />
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
import ScholasticStandingNonPunitiveBanner from "@/components/common/students/applicationDetails/ScholasticStandingNonPunitiveBanner.vue";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";
import { computed, ref } from "vue";
import { StudentScholasticStandingChangeType } from "@/types";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
    ScholasticStandingReversalBanner,
    ScholasticStandingNonPunitiveBanner,
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

    const isNonPunitiveWithdrawal = computed(
      () =>
        scholasticStandingDetails.value.scholasticStandingChangeType ===
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram &&
        !!scholasticStandingDetails.value.nonPunitiveFormSubmissionItemId,
    );

    return {
      AESTRoutesConst,
      dataLoaded,
      hasReversal,
      isNonPunitiveWithdrawal,
    };
  },
};
</script>
