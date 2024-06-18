<template>
  <body-header title="Export reports" />
  <formio
    formName="exportfinancialreports"
    @loaded="formLoaded"
    @changed="formChanged"
    @submitted="exportReport"
  ></formio>
  <v-row class="justify-center m-4">
    <check-permission-role :role="Role.AESTReports">
      <template #="{ notAllowed }">
        <v-btn
          color="primary"
          @click="submitForm"
          :disabled="notAllowed"
          :loading="loading"
          >Export CSV file</v-btn
        >
      </template>
    </check-permission-role>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import {
  ReportsFilterAPIInDTO,
  OptionItemAPIOutDTO,
} from "@/services/http/dto";
import {
  useSnackBar,
  useFileUtils,
  useFormioDropdownLoader,
  useFormioUtils,
} from "@/composables";
import { FormIOChangeEvent, FormIOForm, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
  },
  props: {
    reportList: { type: Array<OptionItemAPIOutDTO>, required: true },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const { downloadReports } = useFileUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const { getFirstComponent } = useFormioUtils();
    const REPORT_TYPE_DROPDOWN_KEY = "reportName";
    const loading = ref(false);
    const PROGRAM_YEAR_DROPDOWN_KEY = "programYear";
    const INSTITUTION_DROPDOWN_KEY = "institutionId";
    let formData: FormIOForm;
    const formLoaded = async (form: FormIOForm) => {
      formData = form;
      await formioDataLoader.loadDropdown(
        formData,
        REPORT_TYPE_DROPDOWN_KEY,
        props.reportList,
      );
    };
    const formChanged = async (form: FormIOForm, event: FormIOChangeEvent) => {
      // Populates the program year select component, institution select component if required.
      if (event.changed?.component.key === REPORT_TYPE_DROPDOWN_KEY) {
        if (event.changed["value"] === "Ministry_Student_Unmet_Need_Report") {
          form["root"].getComponent(
            "institutionId",
          ).component.validate.required = false;
          form["root"].getComponent("institutionId").triggerRedraw();
        }
        if (event.changed["value"] === "Program_And_Offering_Status_Report") {
          form["root"].getComponent(
            "institutionId",
          ).component.validate.required = true;
          form["root"].getComponent("institutionId").triggerRedraw();
        }
        const programYearSelect = getFirstComponent(
          form,
          PROGRAM_YEAR_DROPDOWN_KEY,
        );
        if (
          programYearSelect._visible &&
          !programYearSelect.selectOptions.length
        ) {
          // Load program year data if the select is visible and
          // its items are not populated yet.
          await formioDataLoader.loadProgramYear(
            form,
            PROGRAM_YEAR_DROPDOWN_KEY,
          );
        }
        const institutionSelect = getFirstComponent(
          form,
          INSTITUTION_DROPDOWN_KEY,
        );
        if (
          institutionSelect._visible &&
          !institutionSelect.selectOptions.length
        ) {
          // Load institution data if the select is visible and
          // its items are not populated yet.
          await formioDataLoader.loadInstitutionName(
            form,
            INSTITUTION_DROPDOWN_KEY,
          );
        }
      }
    };
    const submitForm = () => {
      formData.submit();
    };
    const exportReport = async (data: ReportsFilterAPIInDTO) => {
      try {
        loading.value = true;
        await downloadReports(data);
      } catch {
        snackBar.error("Unexpected error while downloading the report.");
      } finally {
        loading.value = false;
      }
    };
    return { exportReport, formLoaded, formChanged, submitForm, Role, loading };
  },
});
</script>
