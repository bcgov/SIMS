<template>
  <v-container>
    <v-btn
      color="primary"
      class="float-right"
      :disabled="sinValidStatus !== SINStatusEnum.VALID"
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
import { useSnackBar } from "@/composables";
import { useStore } from "vuex";
import { SINStatusEnum } from "@/types";
import { computed } from "vue";

export default {
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const store = useStore();

    const sinValidStatus = computed(
      () => store.state.student.sinValidStatus.sinStatus,
    ).value;

    const goToStudentApplication = async () => {
      try {
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
        });
      } catch (error) {
        snackBar.error(
          "An error happened while trying to start an application.",
        );
      }
    };
    return {
      StudentRoutesConst,
      goToStudentApplication,
      SINStatusEnum,
      sinValidStatus,
    };
  },
};
</script>
