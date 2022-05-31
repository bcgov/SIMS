<template>
  <!-- The attribute hide-restriction must be enabled only for Student Account Activity page
       as it already has restriction details in it.
   -->
  <student-page-container layout-template="centered" hide-restriction="true">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="AccountActivity"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <template #content
      ><formio formName="studentaccountactivity" :data="initialData"></formio
    ></template>
  </student-page-container>
</template>
<script lang="ts">
import { computed, onMounted } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentRestriction } from "@/store/modules/student/student";
import { useStudentStore } from "@/composables";

interface StudentAccountActivityFormModel {
  restrictions: StudentRestriction[];
}

export default {
  setup() {
    const { activeRestrictions, updateRestrictions } = useStudentStore();

    const initialData = computed<StudentAccountActivityFormModel>(() => {
      return {
        restrictions: activeRestrictions.value,
      };
    });
    onMounted(async () => {
      await updateRestrictions();
    });
    return {
      StudentRoutesConst,
      initialData,
    };
  },
};
</script>
