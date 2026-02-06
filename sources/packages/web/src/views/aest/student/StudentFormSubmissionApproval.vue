<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Forms" sub-title="Form submission" />
    </template>
    <form-submission-approval
      :form-submission-id="formSubmissionId"
      :show-approval-details="true"
      :read-only="false"
    />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import FormSubmissionApproval from "@/components/form-submissions/FormSubmissionApproval.vue";

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
    return {
      AESTRoutesConst,
    };
  },
});
</script>
