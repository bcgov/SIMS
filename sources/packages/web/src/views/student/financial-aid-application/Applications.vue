<template>
  <v-container>
    <v-btn
      color="primary"
      class="p-button-raised float-right"
      :disabled="hasRestriction || sinValidStatus !== SINStatusEnum.VALID"
      @click="goToStudentApplication()"
    >
      <v-icon size="25">mdi-text-box-plus</v-icon>
      Start New Application
    </v-btn>
  </v-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useToastMessage } from "@/composables";
import { useStore } from "vuex";
import { SINStatusEnum } from "@/types";

export default {
  props: {
    hasRestriction: {
      type: Boolean,
    },
  },
  computed: {
    sinValidStatus() {
      const store = useStore();
      return store.state.student.sinValidStatus.sinStatus;
    },
  },
  setup() {
    const router = useRouter();
    const toast = useToastMessage();
    const goToStudentApplication = async () => {
      try {
        router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while trying to start an application.",
        );
      }
    };
    return {
      StudentRoutesConst,
      goToStudentApplication,
      SINStatusEnum,
    };
  },
};
</script>
