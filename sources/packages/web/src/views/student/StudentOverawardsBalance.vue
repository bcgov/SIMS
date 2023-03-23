<template>
  <student-page-container layout-template="centered" hide-restriction="true">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="Overawards Balance"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <formio-container
      formName="studentOverawardsBalance"
      :formData="initialData"
    />
  </student-page-container>
</template>
<script lang="ts">
import { computed, onMounted, defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentRestriction } from "@/store/modules/student/student";
import { useStudentStore } from "@/composables";

interface StudentAccountActivityFormModel {
  restrictions: StudentRestriction[];
}

export default defineComponent({
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
});
</script>
