<template>
  <header-navigator
    title="Assessments"
    :routeLocation="goBackRouteParams"
    subTitle="View Submission"
  />
  <full-page-container class="p-m-4">
    <scholastic-standing-form :initialData="initialData" />
  </full-page-container>
</template>
<script lang="ts">
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";
import { computed, onMounted, ref } from "vue";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw } from "vue-router";

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
    const initialData = ref({} as ScholasticStandingSubmittedDetailsAPIOutDTO);

    onMounted(async () => {
      initialData.value =
        await ScholasticStandingService.shared.getScholasticStanding(
          props.scholasticStandingId,
        );
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
