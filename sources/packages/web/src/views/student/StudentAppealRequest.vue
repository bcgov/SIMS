<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator title="Student" subTitle="Request a Change" />
    </template>
    <student-appeal-submit
      :application-id="applicationId"
      :is-change-request="true"
      ><template #submit-appeal-header>
        <body-header
          title="Complete all question(s) below"
          subTitle="All requested changes will be reviewed by StudentAid BC after you submit for review."
        >
        </body-header>
        <div class="mt-4">
          <p class="font-bold">Instructions:</p>
          <ul>
            <li>You must complete all fields of the change request form.</li>
            <li>
              All information that has not changed should match what was entered
              on your application.
            </li>
            <li>
              Information from previously approved Change Requests attached to
              this application must be re-entered here.
            </li>
          </ul>
        </div>
      </template></student-appeal-submit
    >
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentAppealSubmit from "@/components/students/StudentAppealSubmit.vue";

export default defineComponent({
  components: {
    StudentAppealSubmit,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
});
</script>
