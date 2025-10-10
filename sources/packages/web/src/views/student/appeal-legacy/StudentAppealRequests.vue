<!-- Legacy appeals requests (a.k.a. "change request"). -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Application details"
        sub-title="View Request"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            id: applicationId,
          },
        }"
      />
    </template>
    <student-appeal-requests-approval
      :appeal-id="appealId"
      :read-only-form="true"
    />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealRequestsApproval from "@/components/common/students/applicationDetails/StudentAppealRequestsApproval.vue";

export default defineComponent({
  components: {
    StudentAppealRequestsApproval,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    appealId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
