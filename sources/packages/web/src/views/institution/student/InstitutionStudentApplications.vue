<template>
  <tab-container>
    <student-applications-simplified-summary
      :studentId="studentId"
      @goToApplication="goToApplication"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentApplicationsSimplifiedSummary from "@/components/common/students/StudentApplicationsSimplifiedSummary.vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { StudentApplicationsSimplifiedSummary },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const goToApplication = (id: number) => {
      return router.push({
        name: InstitutionRoutesConst.STUDENT_APPLICATION_DETAILS,
        params: {
          applicationId: id,
          studentId: props.studentId,
        },
      });
    };
    return { goToApplication };
  },
});
</script>
