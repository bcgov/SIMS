<template>
  <student-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Application details"
        subTitle="View Assessment"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
      <detail-header :headerMap="headerData" />
    </template>
    <body-header-container :enable-card-view="true">
      <assessment-award
        :assessment-award-data="assessmentAwardData"
        :notice-of-assessment-route="noticeOfAssessmentRoute"
    /></body-header-container>
    <body-header-container :enable-card-view="true">
      <v-row>
        <v-col>
          <h2 class="category-header-medium primary-color">
            How to receive your award
          </h2>
          <p class="black-color my-3">
            Please visit the
            <strong>National Student Loan Service Centre (NSLSC)</strong>
            to collect your awarded funds. It may take time to process if you do
            not see it immediately. Please contact NSLSC if you have additional
            questions about receiving your funds.
          </p>
          <v-btn
            color="primary"
            prepend-icon="fa:fas fa-up-right-from-square"
            href="https://protege-secure.csnpe-nslsc.canada.ca/en/public/register-account"
            target="_blank"
            rel="noopener"
            >Go to NSLSC</v-btn
          >
        </v-col>
        <v-col md="3"
          ><v-img
            height="150"
            alt="How to receive your payment"
            src="@/assets/images/person-with-piggy-bank.svg"
        /></v-col>
      </v-row>
    </body-header-container>
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, onMounted, defineComponent, computed } from "vue";
import { useAssessment } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { LayoutTemplates } from "@/types";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import AssessmentAward from "@/components/common/students/applicationDetails/AssessmentAward.vue";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";

export default defineComponent({
  components: { AssessmentAward, DetailHeader, BodyHeaderContainer },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
    currentAssessmentId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const assessmentAwardData = ref<AwardDetailsAPIOutDTO>();
    const { mapAssessmentDetailHeader } = useAssessment();
    const headerData = ref<Record<string, string>>({});

    onMounted(async () => {
      assessmentAwardData.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
      headerData.value = mapAssessmentDetailHeader(assessmentAwardData.value);
    });

    const noticeOfAssessmentRoute = computed(() => ({
      name: StudentRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
      params: {
        applicationId: props.applicationId,
        assessmentId: props.assessmentId,
        currentAssessmentId: props.currentAssessmentId,
      },
    }));

    return {
      StudentRoutesConst,
      noticeOfAssessmentRoute,
      assessmentAwardData,
      headerData,
      LayoutTemplates,
    };
  },
});
</script>
