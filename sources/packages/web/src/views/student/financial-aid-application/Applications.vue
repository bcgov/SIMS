<template>
  <div>
    <Dropdown
      class="p-col-12"
      v-model="formName"
      :options="programYearList"
      optionLabel="name"
      optionValue="code"
      placeholder="Select a Program Year"
      :style="{ width: '30vw' }"
      @change="onYearChange"
    />
    <br />
    <br />
    <v-btn
      color="primary"
      class="p-button-raised float-right"
      :disabled="!formName"
      @click="startNewApplication"
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
import {
  ONLY_ONE_DRAFT_ERROR,
  ApiProcessError,
} from "@/types/contracts/ApiProcessError";
import { useToastMessage } from "@/composables";

export default {
  emits: ["update:formName", "change"],
  setup(props: any, context: SetupContext) {
    const router = useRouter();
    const toast = useToastMessage();
    const programYearList = ref();
    const formName = ref();
    const onYearChange = (event: any) => {
      context.emit("update:formName", event.value);
      context.emit("change", event);
    };

    onMounted(async () => {
      const programYears = await ProgramYearService.shared.getProgramYears();
      programYearList.value = programYears.map((programYear: ProgramYear) => ({
        name: `(${programYear.programYear}) - ${programYear.programYearDesc}`,
        code: programYear.formName,
      }));
    });

    const startNewApplication = async () => {
      try {
        const createDraftResult = await ApplicationService.shared.createApplicationDraft();
        if (createDraftResult.draftAlreadyExists) {
          toast.error(
            "Not able to start a new application",
            "There is a draft of an application in progress. Please continue it or remove it.",
          );
          return;
        }
        router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: formName.value,
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
      formName,
      StudentRoutesConst,
      startNewApplication,
    };
  },
};
</script>
