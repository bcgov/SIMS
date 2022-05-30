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
import { RestrictionNotificationType } from "@/types";

export default {
  setup() {
    const { activeRestrictions } = useStudentStore();
    //Student activity page must show restriction codes with notification type of warning or error.
    const initialData = computed<StudentAccountActivityFormModel>(() => {
      return {
        restrictions: activeRestrictions.value?.filter(
          (restriction) =>
            restriction.type === RestrictionNotificationType.Warning ||
            restriction.type === RestrictionNotificationType.Error,
        ),
      };
    });

    return {
      StudentRoutesConst,
      activeRestrictions,
      initialData,
    };
  },
};
</script>
