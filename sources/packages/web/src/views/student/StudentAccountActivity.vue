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
    <tab-container :enableCardView="false" class="mb-6">
      <student-scholastic-standing-limited-history
    /></tab-container>
    <formio-container
      formName="studentAccountActivity"
      :formData="initialData"
    />
  </student-page-container>
</template>
<script lang="ts">
import { computed, onMounted, defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentRestriction } from "@/store/modules/student/student";
import { useStudentStore } from "@/composables";
import StudentScholasticStandingLimitedHistory from "@/components/common/students/StudentScholasticStandingLimitedHistory.vue";

interface StudentAccountActivityFormModel {
  restrictions: StudentRestriction[];
}

export default defineComponent({
  components: { StudentScholasticStandingLimitedHistory },
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
