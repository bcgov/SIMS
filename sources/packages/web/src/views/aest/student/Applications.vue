<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <StudentApplications
        :studentId="studentId"
        @goToApplication="goToApplication"
      />
    </div>
  </v-card>
</template>

<script lang="ts">
import StudentApplications from "@/components/aest/StudentApplications.vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { StudentApplications },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
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
};
</script>
