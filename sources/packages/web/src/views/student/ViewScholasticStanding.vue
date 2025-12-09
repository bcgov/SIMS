<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        sub-title="View Submission"
        :route-location="goBackRouteParams"
      />
    </template>
    <scholastic-standing-reversal-banner v-if="hasReversal" />
    <scholastic-standing-form
      :scholastic-standing-id="scholasticStandingId"
      :read-only="true"
      :processing="false"
      @data-loaded="dataLoaded"
    />
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, ref } from "vue";
import { RouteLocationRaw } from "vue-router";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import ScholasticStandingReversalBanner from "@/components/common/students/applicationDetails/ScholasticStandingReversalBanner.vue";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
    ScholasticStandingReversalBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const scholasticStandingDetails = ref(
      {} as ScholasticStandingSubmittedDetailsAPIOutDTO,
    );

    const dataLoaded = (data: ScholasticStandingSubmittedDetailsAPIOutDTO) => {
      scholasticStandingDetails.value = data;
    };

    const hasReversal = computed(
      () => !!scholasticStandingDetails.value.reversalDate,
    );

    const goBackRouteParams = computed(
      () =>
        ({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: { id: props.applicationId },
        }) as RouteLocationRaw,
    );

    return { goBackRouteParams, dataLoaded, hasReversal };
  },
};
</script>
