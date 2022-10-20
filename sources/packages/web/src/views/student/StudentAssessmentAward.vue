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
    <v-card class="p-4">
      <body-header
        title="Summary"
        subTitle="Below is the summary from your assessment. To view your entire assessment, click on View assessment."
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
      <assessment-award-details :assessmentAwardData="assessmentAward" />
    </v-card>
    <v-card class="p-4 my-3">
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
    </v-card>
  </student-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ref, onMounted, defineComponent } from "vue";
import { useAssessment } from "@/composables";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { LayoutTemplates } from "@/types";
import AssessmentAwardDetails from "@/components/common/AssessmentAwardDetails.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";

export default defineComponent({
  components: { AssessmentAwardDetails, DetailHeader },
  props: {
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
    const router = useRouter();
    const assessmentAward = ref<AwardDetailsAPIOutDTO>();
    const { mapAssessmentDetailHeader } = useAssessment();
    const headerData = ref<Record<string, string>>({});

    onMounted(async () => {
      assessmentAward.value =
        await StudentAssessmentsService.shared.getAssessmentAwardDetails(
          props.assessmentId,
        );
      headerData.value = mapAssessmentDetailHeader(assessmentAward.value);
    });

    const goToNoticeOfAssessment = () => {
      return router.push({
        name: StudentRoutesConst.ASSESSMENT,
        params: {
          applicationId: props.applicationId,
          assessmentId: props.assessmentId,
        },
      });
    };

    return {
      StudentRoutesConst,
      goToNoticeOfAssessment,
      assessmentAward,
      headerData,
      LayoutTemplates,
    };
  },
});
</script>
