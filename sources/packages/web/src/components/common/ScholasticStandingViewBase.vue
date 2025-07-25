<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <scholastic-standing-form
      :initialData="initialData"
      :readOnly="true"
      :processing="false"
      :showFooter="showFooter"
    />
  </full-page-container>
</template>
<script lang="ts">
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import { computed, onMounted, ref, defineComponent } from "vue";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw } from "vue-router";
import { useFormatters } from "@/composables";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  name: "ScholasticStandingViewBase",
  components: {
    ScholasticStandingForm,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
    formProps: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    showFooter: {
      type: Boolean,
      required: false,
      default: false,
    },
    showCompleteInfo: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const initialData = ref({} as ScholasticStandingSubmittedDetailsAPIOutDTO);
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
        showCompleteInfo: props.showCompleteInfo,
      };
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
});
</script>
