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
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="studentapplication"
        :data="initialData"
        @loaded="formLoaded"
        @submitted="submitted"
        @customEvent="customEventCallback"
      ></formio>
    </v-container>
  </v-sheet>
</template>
<script lang="ts">
import { ref } from "vue";
import formio from "../../../components/generic/formio.vue";
import { useFormioDropdownLoader, useFormioUtils } from "@/composables";
import { useRouter } from "vue-router";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { useToastMessage } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramYearService } from "@/services/ProgramYearService";

export default {
  components: { formio },
  setup(props: any) {
    const initialData = ref({});
    const router = useRouter();
    const toast = useToastMessage();
    const formioDataLoader = useFormioDropdownLoader();
    const formioUtils = useFormioUtils();
    const showOnlyOneDraftDialog = ref(false);
    const PROGRAM_YEAR_DROPDOWN_KEY = "programYear";

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadProgramYear(form, PROGRAM_YEAR_DROPDOWN_KEY);
    };

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      try {
        const programYearId = formioUtils.getComponentValueByKey(
          form,
          PROGRAM_YEAR_DROPDOWN_KEY,
        );
        const createDraftResult = await ApplicationService.shared.createApplicationDraft(
          {
            programYearId: programYearId,
            data: {},
            associatedFiles: [],
          },
        );
        if (createDraftResult.draftAlreadyExists) {
          showOnlyOneDraftDialog.value = true;
          return;
        }
        const programYear = await ProgramYearService.shared.getActiveProgramYear(
          programYearId,
        );
        if (
          programYear &&
          programYear.formName &&
          FormIOCustomEventTypes.RouteToStartFullTimePartTimeApplication ===
            event.type
        ) {
          router.push({
            name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
            params: {
              selectedForm: programYear.formName,
              programYearId: programYearId,
              id: Number(createDraftResult.draftId),
            },
          });
        }
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while trying to start a new application.",
        );
      }
    };

    return {
      initialData,
      formLoaded,
      showOnlyOneDraftDialog,
      customEventCallback,
    };
  },
};
</script>
