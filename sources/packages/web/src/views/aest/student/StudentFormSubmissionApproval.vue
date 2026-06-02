<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Forms submission"
        :sub-title="subtitle"
        :back-target="backTarget"
      />
      <form-submission-header-title :form-submission="formSubmission" />
    </template>
    <form-submission-approval
      :form-submission-id="formSubmissionId"
      :show-decision-details="true"
      :read-only="readOnly"
      @loaded="submissionLoaded"
    />
  </full-page-container>
</template>

<script setup lang="ts">
import { PropType, ref } from "vue";
import FormSubmissionApproval from "@/components/form-submissions/FormSubmissionApproval.vue";
import FormSubmissionHeaderTitle from "@/components/form-submissions/FormSubmissionHeaderTitle.vue";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto";
import { BackTarget, FormCategory } from "@/types";

defineProps({
  formSubmissionId: {
    type: Number,
    required: true,
  },
  readOnly: {
    type: Boolean,
    required: false,
    default: true,
  },
  backTarget: {
    type: Object as PropType<BackTarget>,
    required: false,
    default: undefined,
  },
});

const subtitle = ref("Submission");
const formSubmission = ref<FormSubmissionMinistryAPIOutDTO>();
const submissionLoaded = (submission: FormSubmissionMinistryAPIOutDTO) => {
  subtitle.value =
    submission.formCategory === FormCategory.StudentAppeal
      ? "Appeal submission"
      : "Form submission";
  formSubmission.value = submission;
};
</script>
