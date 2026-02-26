<template>
  <body-header :title="formSubmission.formCategory">
    <template #subtitle>
      <p>
        <strong>Instructions:</strong>
      </p>
      <ul v-if="formSubmission.formCategory === FormCategory.StudentAppeal">
        <li>Review the appeal(s) and any supporting documentation.</li>
        <li>
          If there is more then one appeal you must add a decision for each.
        </li>
        <li>
          Once all appeals have a decision you can complete your review by
          selecting Submit final decision.
        </li>
      </ul>
      <ul v-else>
        <li>Review the form and any supporting documentation.</li>
        <li>Add a decision for the form.</li>
        <li>
          Once a decision has been added, complete your review by selecting
          Submit final decision.
        </li>
      </ul>
    </template>
    <template #status-chip>
      <status-chip-form-submission :status="formSubmission.status" />
    </template>
  </body-header>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FormCategory } from "@/types";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";

type FormSubmission = Pick<
  FormSubmissionMinistryAPIOutDTO,
  "formCategory" | "status"
>;

export default defineComponent({
  components: {
    StatusChipFormSubmission,
  },
  props: {
    formSubmission: {
      type: Object as PropType<FormSubmission>,
      required: true,
    },
  },
  setup() {
    return {
      FormCategory,
    };
  },
});
</script>
