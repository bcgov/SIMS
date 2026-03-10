<template>
  <v-card class="mb-4 p-4">
    <form-submission-history />
  </v-card>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import FormSubmissionHistory from "@/components/form-submissions/FormSubmissionHistory.vue";

export default defineComponent({
  components: {
    FormSubmissionHistory,
  },
  setup() {
    const goToSubmission = async (formSubmissionId: number) => {
      await router.push({
        name: StudentRoutesConst.STUDENT_FORMS_SUBMISSION_VIEW,
        params: {
          formSubmissionId,
        },
      });
    };
    return {
      goToSubmission,
    };
  },
});
</script>
