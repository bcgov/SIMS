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
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
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
        name: AESTRoutesConst.FORM_SUBMISSION_APPROVAL_FROM_HISTORY,
        params: {
          formSubmissionId,
        },
        query: {
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
