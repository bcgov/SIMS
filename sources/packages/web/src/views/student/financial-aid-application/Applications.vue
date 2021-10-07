<template>
  <div>
    <br />
    <v-btn
      color="primary"
      class="p-button-raised float-right"
      @click="gotoStudentApplication()"
    >
      <v-icon size="25">mdi-text-box-plus</v-icon>
      Start New Application
    </v-btn>
  </div>
</template>
<script lang="ts">
import { SetupContext } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { useToastMessage } from "@/composables";

export default {
  emits: ["update:programYear", "change"],
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    const toast = useToastMessage();
    const gotoStudentApplication = async () => {
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
      gotoStudentApplication,
    };
  },
};
</script>
