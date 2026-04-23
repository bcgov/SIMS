<template>
  <tab-container>
    <form-submission-history
      :student-id="studentId"
      :can-view-form-submitted-data="false"
    />
  </tab-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
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
});
</script>
