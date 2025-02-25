<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessment"
        subTitle="Notice of Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW,
          params: { applicationId, studentId, assessmentId },
        }"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <notice-of-assessment-form-view
      :assessment-id="assessmentId"
      :can-reissue-m-s-f-a-a="hasStudentReissueMSFAARole"
      @reissue-m-s-f-a-a="reissueMSFAA"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NoticeOfAssessmentFormView from "@/components/common/NoticeOfAssessmentFormView.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationService } from "@/services/ApplicationService";
import { useAuth, useSnackBar } from "@/composables";
import { Role } from "@/types";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    NoticeOfAssessmentFormView,
    ApplicationHeaderTitle,
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
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const snackBar = useSnackBar();
    const { hasRole } = useAuth();
    const hasStudentReissueMSFAARole = hasRole(Role.StudentReissueMSFAA);
    const reissueMSFAA = async (
      applicationId: number,
      reloadNOA: () => Promise<void>,
      processing: (processing: boolean) => void,
    ) => {
      try {
        processing(true);
        await ApplicationService.shared.reissueMSFAA(applicationId);
        snackBar.success("MSFAA was reissued successfully.");
        await reloadNOA();
      } catch {
        snackBar.error("Error while reissuing the MSFAA.");
      } finally {
        processing(false);
      }
    };

    return {
      reissueMSFAA,
      AESTRoutesConst,
      hasStudentReissueMSFAARole,
    };
  },
});
</script>
