<template>
  <tab-container>
    <form-submission-history
      :student-id="studentId"
      @go-to-submission="goToSubmission"
    />
  </tab-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import FormSubmissionHistory from "@/components/form-submissions/FormSubmissionHistory.vue";

export default defineComponent({
  components: {
    FormSubmissionHistory,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const goToSubmission = async (formSubmissionId: number) => {
      await router.push({
        name: InstitutionRoutesConst.STUDENT_FORM_SUBMISSION_VIEW_FROM_HISTORY,
        params: {
          formSubmissionId,
          studentId: props.studentId,
        },
      });
    };
    return {
      goToSubmission,
    };
  },
});
</script>
