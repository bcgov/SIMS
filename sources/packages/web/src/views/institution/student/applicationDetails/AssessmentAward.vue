<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Assessment"
        :routeLocation="routeLocation"
      />
      <detail-header :headerMap="headerMap" />
    </template>
    <assessment-award
      :assessment-award-data="assessmentAwardData"
      :notice-of-assessment-route="noticeOfAssessmentRoute"
    />
  </full-page-container>
</template>
<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, onMounted, defineComponent, computed } from "vue";
import { useAssessment } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import AssessmentAward from "@/components/common/students/applicationDetails/AssessmentAward.vue";
import { ApplicationService } from "@/services/ApplicationService";

export default defineComponent({
  components: { AssessmentAward, DetailHeader },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();
    const { mapAssessmentDetailHeader } = useAssessment();
    const headerMap = ref<Record<string, string>>({});

    onMounted(async () => {
      await loadAssessmentAwardValues();
    });

    const loadAssessmentAwardValues = async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
          props.studentId,
          props.applicationId,
        );
      headerMap.value = mapAssessmentDetailHeader(assessmentAwardData.value);
    };

    const noticeOfAssessmentRoute = computed(() => ({
      name: InstitutionRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
      params: {
        studentId: props.studentId,
        applicationId: props.applicationId,
        assessmentId: props.assessmentId,
      },
    }));

    const routeLocation = computed(() => ({
      name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    }));

    return {
      InstitutionRoutesConst,
      noticeOfAssessmentRoute,
      assessmentAwardData,
      headerMap,
      routeLocation,
    };
  },
});
</script>
