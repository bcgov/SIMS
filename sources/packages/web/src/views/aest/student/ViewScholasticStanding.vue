<template>
  <header-navigator
    title="Assessments"
    :routeLocation="goBackRouteParams"
    subTitle="View Submission"
  />
  <full-page-container>
    <scholastic-standing-form :initialData="initialData" />
  </full-page-container>
</template>
<script lang="ts">
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import { computed, onMounted, ref } from "vue";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw } from "vue-router";
import { useFormatters } from "@/composables";
import { ScholasticStandingSubmittedDetails } from "@/types";

export default {
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
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref({} as ScholasticStandingSubmittedDetails);
    const { dateOnlyLongString } = useFormatters();

    onMounted(async () => {
      const applicationDetails =
        await ScholasticStandingService.shared.getScholasticStanding(
          props.scholasticStandingId,
        );

      initialData.value = {
        ...applicationDetails,
        applicationOfferingStartDate: dateOnlyLongString(
          applicationDetails.applicationOfferingStartDate,
        ),
        applicationOfferingEndDate: dateOnlyLongString(
          applicationDetails.applicationOfferingEndDate,
        ),
        applicationOfferingStudyBreak:
          applicationDetails.applicationOfferingStudyBreak?.map(
            (studyBreak) => ({
              breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
              breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
            }),
          ),
      };
      console.log(initialData.value);
    });
    const goBackRouteParams = computed(
      () =>
        ({
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        } as RouteLocationRaw),
    );

    return { initialData, goBackRouteParams };
  },
};
</script>
