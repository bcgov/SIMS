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
        <v-btn @click="showOnlyOneDraftDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <div>
    <Dropdown
      class="p-col-12"
      v-model="programYear"
      :options="programYearList"
      optionLabel="name"
      optionValue="programYear"
      placeholder="Select a Program Year"
      :style="{ width: '30vw' }"
      @change="onYearChange"
    />
    <br />
    <br />
    <v-btn
      color="primary"
      class="p-button-raised float-right"
      :disabled="!programYear"
      @click="startNewApplication()"
    >
      <v-icon size="25">mdi-text-box-plus</v-icon>
      Start New Application
    </v-btn>
  </div>
</template>
<script lang="ts">
import { ProgramYearService } from "@/services/ProgramYearService";
import { SetupContext, onMounted, ref } from "vue";
import { ProgramYear } from "@/types/contracts/ProgramYearContract";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationService } from "@/services/ApplicationService";
import { useToastMessage } from "@/composables";

export default {
  emits: ["update:programYear", "change"],
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    const toast = useToastMessage();
    const programYearList = ref();
    const showOnlyOneDraftDialog = ref(false);
    const programYear = ref({} as ProgramYear);
    const onYearChange = (event: any) => {
      context.emit("update:programYear", event.value);
      context.emit("change", event);
    };

    onMounted(async () => {
      const programYears = await ProgramYearService.shared.getProgramYears();
      programYearList.value = programYears.map(
        (programYearItem: ProgramYear) => ({
          name: `(${programYearItem.programYear}) - ${programYearItem.programYearDesc}`,
          programYear: programYearItem,
        }),
      );
    });

    const startNewApplication = async () => {
      try {
        const createDraftResult = await ApplicationService.shared.createApplicationDraft(
          {
            programYearId: programYear.value.id,
            data: {},
            associatedFiles: [],
          },
        );
        if (createDraftResult.draftAlreadyExists) {
          showOnlyOneDraftDialog.value = true;
          return;
        }
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: programYear.value.formName,
            programYearId: programYear.value.id,
            id: Number(createDraftResult.draftId),
          },
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while trying to start a new application.",
        );
      }
    };

    return {
      programYearList,
      onYearChange,
      programYear,
      StudentRoutesConst,
      startNewApplication,
      showOnlyOneDraftDialog,
    };
  },
};
</script>
