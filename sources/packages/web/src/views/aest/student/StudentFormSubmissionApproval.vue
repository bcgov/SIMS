<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Forms" :sub-title="subtitle" />
    </template>
    <form-submission-approval
      :form-submission-id="formSubmissionId"
      :show-decision-details="true"
      :read-only="false"
      @loaded="submissionLoaded"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import FormSubmissionApproval from "@/components/form-submissions/FormSubmissionApproval.vue";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto";
import { FormCategory } from "@/types";

export default defineComponent({
  components: {
    FormSubmissionApproval,
  },
  props: {
    formSubmissionId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const subtitle = ref("Submission");
    const submissionLoaded = (submission: FormSubmissionMinistryAPIOutDTO) => {
      subtitle.value =
        submission.formCategory === FormCategory.StudentAppeal
          ? "Appeal submission"
          : "Form submission";
    };
    return {
      AESTRoutesConst,
      submissionLoaded,
      subtitle,
    };
  },
});
</script>
