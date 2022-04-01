<template>
  <v-container>
    <div class="mb-4">
      <header-navigator
        title="Assessment"
        subTitle="View Request"
        :routeLocation="assessmentsSummaryRoute"
      />
    </div>
    <full-page-container>
      <body-header title="Student change"></body-header>
      <student-appeal-form
        v-for="formName in appealFormNames"
        :key="formName"
        :formName="formName"
      ></student-appeal-form>
      <div class="mt-4">
        <v-btn color="primary" outlined @click="gotToAssessmentsSummary"
          >Cancel</v-btn
        >
        <v-btn class="primary-btn-background">Complete student request</v-btn>
      </div>
    </full-page-container>
  </v-container>
</template>
<script lang="ts">
import { computed, ref } from "vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import StudentAppealForm from "@/components/common/StudentAppealForm.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";

export default {
  components: {
    HeaderNavigator,
    FullPageContainer,
    BodyHeader,
    StudentAppealForm,
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
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    let requestFormData: any = undefined;
    const appealFormNames = ref([] as string[]);
    let appealForms: any = [];
    const showRequestForAppeal = computed(
      () => appealFormNames.value.length === 0,
    );

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    const gotToAssessmentsSummary = () => {
      router.push(assessmentsSummaryRoute);
    };

    const formLoaded = (form: any) => {
      requestFormData = form;
    };

    appealForms = [];
    console.log(appealForms);

    return {
      formLoaded,
      appealFormNames,
      showRequestForAppeal,
      AESTRoutesConst,
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
    };
  },
};
</script>
