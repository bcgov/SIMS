<template>
  <!-- The attribute hide-restriction must be enabled only for Student Account Activity page
       as it already has restriction details in it.
   -->
  <student-page-container layout-template="centered" hide-restriction="true">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="Account Activity"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <student-account-restrictions />
    <student-scholastic-standing-limited-history />
    <formio-container formName="studentAccountActivity" />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentScholasticStandingLimitedHistory from "@/components/common/students/StudentScholasticStandingLimitedHistory.vue";
import StudentAccountRestrictions from "@/components/common/students/StudentAccountRestrictions.vue";

export default defineComponent({
  components: {
    StudentAccountRestrictions,
    StudentScholasticStandingLimitedHistory,
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
