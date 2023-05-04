<template>
  <tab-container>
    <student-applications
      :studentId="studentId"
      :enable-view-application="true"
      @goToApplication="goToApplicationDetails"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentApplications from "@/components/common/students/StudentApplications.vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { StudentApplications },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const router = useRouter();
    // todo: This logic will be remove in guru's PR. ASSESSMENTS_SUMMARY is assessed by the new sidebar.
    const goToApplicationDetails = (id: number) => {
      console.log(id, "___________");
      return router.push({
        name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
        params: {
          id: id,
        },
      });
    };
    return {
      goToApplicationDetails,
    };
  },
});
</script>
