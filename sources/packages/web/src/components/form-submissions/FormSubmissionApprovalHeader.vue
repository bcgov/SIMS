<template>
  <body-header :title="formSubmission.formCategory">
    <template #subtitle>
      <p>
        <strong>Instructions:</strong>
      </p>
      <ul>
        <li>
          Review all applicable information to adjudicate and record a decision
          for the form submission.
        </li>
        <li>
          Students may resubmit forms and any changes will overwrite the
          previous version.
          <ul>
            <li>
              Application appeals only: Any appeals not included in the current
              submission will overwrite previous versions and no longer affect
              the assessment.
            </li>
          </ul>
        </li>
        <li>
          Where multiple items are present, all items must have a decision saved
          before a final decision can be submitted.
        </li>
        <li>
          Once all required decisions have been saved, click the submission
          button to complete the review.
        </li>
      </ul>
    </template>
    <template #status-chip>
      <status-chip-form-submission
        v-if="!loading"
        :status="formSubmission.status"
      />
    </template>
  </body-header>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";

type FormSubmission = Pick<
  FormSubmissionMinistryAPIOutDTO,
  "formCategory" | "status"
>;

defineProps({
  formSubmission: {
    type: Object as PropType<FormSubmission>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
});
</script>
