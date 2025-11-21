<template>
  <v-container>
    <v-btn
      color="primary"
      class="float-right"
      :disabled="!hasValidSIN"
      @click="goToStudentApplication()"
      prepend-icon="fa:fa fa-edit"
    >
      Start New Application
    </v-btn>
  </v-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useSnackBar, useStudentStore } from "@/composables";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { hasValidSIN } = useStudentStore();

    const goToStudentApplication = async () => {
      try {
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
        });
      } catch {
        snackBar.error(
          "An error happened while trying to start an application.",
        );
      }
    };
    return {
      StudentRoutesConst,
      goToStudentApplication,
      hasValidSIN,
    };
  },
});
</script>
