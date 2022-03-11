<template>
  <ModalDialogBase
    title="Application already in progress"
    dialogType="warning"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <v-container>
        <form>
          <p>There is already a draft of an application in progress.</p>
          <p>Please continue your draft application or cancel it.</p>
        </form>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> Close </v-btn>
    </template>
  </ModalDialogBase>
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="studentapplication"
        :data="initialData"
        @loaded="formLoaded"
        @customEvent="customEventCallback"
      ></formio>
    </v-container>
  </v-sheet>
</template>
<script lang="ts">
import { ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import formio from "../../../components/generic/formio.vue";
import {
  useFormioDropdownLoader,
  useFormioUtils,
  useToastMessage,
  useModalDialog,
} from "@/composables";
import { useRouter } from "vue-router";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramYearService } from "@/services/ProgramYearService";

export default {
  components: { formio, ModalDialogBase },
  setup() {
    const initialData = ref({});
    const router = useRouter();
    const toast = useToastMessage();
    const formioDataLoader = useFormioDropdownLoader();
    const formioUtils = useFormioUtils();
    const { showDialog, showModal } = useModalDialog<void>();
    const PROGRAM_YEAR_DROPDOWN_KEY = "programYear";

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadProgramYear(form, PROGRAM_YEAR_DROPDOWN_KEY);
    };
    const dialogClosed = () => {
      showDialog.value = false;
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
          showDialog.value = true;
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
      showModal,
      showDialog,
      dialogClosed,
      customEventCallback,
    };
  },
};
</script>
