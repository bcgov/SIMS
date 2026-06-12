<template>
  <full-page-container :full-width="true">
    <body-header-container
      title="Search Students"
      sub-title="Lookup students by entering their information below."
    >
      <search-students @go-to-student-view="goToStudentView" />
    </body-header-container>
  </full-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import SearchStudents from "@/components/common/SearchStudents.vue";
import router from "@/router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";
export default defineComponent({
  components: {
    SearchStudents,
    BodyHeaderContainer,
  },
  setup() {
    const goToStudentView = (studentId: number) => {
      router.push({
        name: AESTRoutesConst.STUDENT_PROFILE,
        params: { studentId: studentId },
      });
    };
    return {
      goToStudentView,
    };
  },
});
</script>
