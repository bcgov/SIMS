<template>
  <full-page-container>
    <body-header-container>
      <template #header>
        <body-header title="Search Students" title-header-level="2">
          <template #subtitle
            >Lookup students by entering their information below.</template
          >
        </body-header>
      </template>
    </body-header-container>
    <search-students @go-to-student-view="goToStudentView" />
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
