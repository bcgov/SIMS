<template>
  <v-dialog v-model="showOnlyOneDraftDialog">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon class="mr-2" size="35" color="orange">mdi-alert</v-icon>
        Application already in progress
      </v-card-title>
      <v-card-text>
        <p>There is already a draft of an application in progress.</p>
        <p>Please continue your draft application or cancel it.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="showOnlyOneDraftDialog = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
import { SetupContext, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationService } from "@/services/ApplicationService";
import { useToastMessage } from "@/composables";

export default {
  emits: ["update:programYear", "change"],
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    const toast = useToastMessage();
    const showOnlyOneDraftDialog = ref(false);
    const gotoStudentApplication = async () => {
      try {
        const studentDraftApplication = await ApplicationService.shared.hasDraftApplication();
        if (studentDraftApplication) {
          showOnlyOneDraftDialog.value = true;
          return;
        }
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
      showOnlyOneDraftDialog,
    };
  },
};
</script>
