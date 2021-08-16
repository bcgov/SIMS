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
      @click="
        $router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: formName.formName,
            programYearId: formName.id,
          },
        })
      "
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

export default {
  emits: ["update:formName", "change"],
  setup(props: any, context: SetupContext) {
    const programYearList = ref();
    const formName = ref();
    const onYearChange = (event: any) => {
      context.emit("update:formName", event.value);
      context.emit("change", event);
    };
    onMounted(async () => {
      const programYears = await ProgramYearService.shared.getProgramYears();
      programYearList.value = programYears.map((programYear: ProgramYear) => ({
        name:
          "(" + programYear.programYear + ") - " + programYear.programYearDesc,
        code: programYear,
      }));
    });
    return {
      programYearList,
      onYearChange,
      formName,
      StudentRoutesConst,
    };
  },
};
</script>
