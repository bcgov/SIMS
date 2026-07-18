<template>
  <body-header-container title="Export reports">
    <formio
      form-name="exportfinancialreports"
      @loaded="formLoaded"
      @changed="formChanged"
      @submitted="exportReport"
    ></formio>
    <footer-buttons :show-secondary-button="false">
      <template #primary-buttons>
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
      </template>
    </footer-buttons>
  </body-header-container>
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
    const INSTITUTION_NAMES = "institutionNames";
    const PROGRAM_NAMES = "programNames";
    const INSTITUTION_DROPDOWN_KEY = "institution";
    const PROGRAM_DROPDOWN_KEY = "program";
    let loadedProgramsInstitutionId: number | null = null;
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
          await formioDataLoader.loadInstitutionNames(form, INSTITUTION_NAMES);
        }
      } else if (event.changed?.component.key === INSTITUTION_DROPDOWN_KEY) {
        const programSelect = getFirstComponent(form, PROGRAM_DROPDOWN_KEY);
        const institutionId = +event.changed.value;
        if (!institutionId) {
          return;
        }
        if (
          programSelect._visible &&
          (!programSelect.selectOptions.length ||
            loadedProgramsInstitutionId !== institutionId)
        ) {
          // Load program data if the select is visible and
          // its items are not populated yet.
          await formioDataLoader.loadProgramsNames(form, PROGRAM_NAMES, {
            institutionId,
            isIncludeInActiveProgram: true,
          });
          loadedProgramsInstitutionId = institutionId;
        }
      }
    };
    const submitForm = () => {
      formData.submit();
    };
    const exportReport = async (data: ReportsFilterAPIInDTO) => {
      try {
        loading.value = true;
        delete data[INSTITUTION_NAMES];
        delete data[PROGRAM_NAMES];
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
