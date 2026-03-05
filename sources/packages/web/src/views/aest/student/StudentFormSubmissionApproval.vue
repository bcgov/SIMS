<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :sub-title="subtitle"
        :routeLocation="backTarget.to"
      />
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
import { defineComponent, PropType, ref } from "vue";
import FormSubmissionApproval from "@/components/form-submissions/FormSubmissionApproval.vue";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto";
import { BackTarget, FormCategory } from "@/types";

export default defineComponent({
  components: {
    FormSubmissionApproval,
  },
  props: {
    formSubmissionId: {
      type: Number,
      required: true,
    },
    backTarget: {
      type: Object as PropType<BackTarget>,
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
      submissionLoaded,
      subtitle,
    };
  },
});
</script>
