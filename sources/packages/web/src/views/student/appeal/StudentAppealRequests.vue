<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Student"
        sub-title="View Appeal Request"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPEAL,
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
