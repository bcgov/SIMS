<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="AccountActivity"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <formio formName="studentaccountactivity" :data="initialData"></formio>
  </full-page-container>
</template>
<script lang="ts">
import { computed } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAccountActivityFormModel } from "@/views/student/StudentAccountActivityFormModel";
import { useStudentStore } from "@/composables";

export default {
  setup() {
    const { activeRestrictions } = useStudentStore();
    const initialData = computed<StudentAccountActivityFormModel>(() => {
      return { restrictions: activeRestrictions.value };
    });

    return {
      StudentRoutesConst,
      activeRestrictions,
      initialData,
    };
  },
};
</script>
