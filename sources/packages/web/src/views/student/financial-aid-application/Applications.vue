<template>
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
      @click="
        $router.push({
          name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
          params: {
            selectedForm: programYear.formName,
            programYearId: programYear.id,
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
  emits: ["update:programYear", "change"],
  setup(props: any, context: SetupContext) {
    const programYearList = ref();
    const programYear = ref();
    const onYearChange = (event: any) => {
      context.emit("update:programYear", event.value);
      context.emit("change", event);
    };
    onMounted(async () => {
      const programYears = await ProgramYearService.shared.getProgramYears();
      programYearList.value = programYears.map((programYear: ProgramYear) => ({
        name:
          "(" + programYear.programYear + ") - " + programYear.programYearDesc,
        programYear: programYear,
      }));
    });
    return {
      programYearList,
      onYearChange,
      programYear,
      StudentRoutesConst,
    };
  },
};
</script>
