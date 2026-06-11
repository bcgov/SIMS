<template>
  <full-page-container :full-width="true">
    <body-header-container title="Search Students" subtitle="">
    </body-header-container>
    <search-students @go-to-student-view="goToStudentView" />
  </full-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import SearchStudents from "@/components/common/SearchStudents.vue";
import router from "@/router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";
export default defineComponent({
  components: {
    SearchStudents,
    BodyHeaderContainer,
  },
  setup() {
    const goToStudentView = (studentId: number) => {
      router.push({
        name: InstitutionRoutesConst.STUDENT_PROFILE,
        params: { studentId: studentId },
      });
    };
    return {
      goToStudentView,
    };
  },
});
</script>
