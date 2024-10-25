<template>
  <body-header
    title="Funding summary"
    subTitle="Below is the summary from your assessment. To view your Notice of Assessment, click on view assessment."
  >
    <template #actions>
      <v-btn
        class="float-right"
        color="primary"
        prepend-icon="fa:far fa-file-lines"
        @click="goToNoticeOfAssessment"
        >View assessment</v-btn
      >
    </template>
  </body-header>
  <assessment-award-details
    :assessmentAwardData="assessmentAwardData"
    :allowConfirmEnrolment="allowConfirmEnrolment"
    :allow-final-award-extended-information="allowFinalAwardExtendedInformation"
    @confirmEnrolment="$emit('confirmEnrolment', $event)"
  />
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { RouteLocationRaw, useRouter } from "vue-router";
import { defineComponent, PropType } from "vue";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import AssessmentAwardDetails from "@/components/common/AssessmentAwardDetails.vue";

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
  },
  components: { AssessmentAwardDetails },
  props: {
    assessmentAwardData: {
      type: Object as PropType<AwardDetailsAPIOutDTO>,
      required: true,
      default: {} as AwardDetailsAPIOutDTO,
    },
    noticeOfAssessmentRoute: {
      type: Object as PropType<RouteLocationRaw>,
      required: true,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowFinalAwardExtendedInformation: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const goToNoticeOfAssessment = () => {
      return router.push(props.noticeOfAssessmentRoute);
    };

    return {
      AESTRoutesConst,
      goToNoticeOfAssessment,
    };
  },
});
</script>
