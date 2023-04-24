<template>
  <tab-container>
    <student-applications
      :studentId="studentId"
      @goToApplication="goToApplication"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentApplications from "@/components/common/students/StudentApplications.vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { StudentApplications },
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
        name: AESTRoutesConst.APPLICATION_DETAILS,
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
