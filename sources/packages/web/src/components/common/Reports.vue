<template>
  <full-page-container>
    <template #header>
      <header-navigator :title="title" subTitle="Reports" />
    </template>
    <body-header title="Export reports" />
    <formio
      formName="exportfinancialreports"
      @loaded="formLoaded"
      @submitted="exportReport"
    ></formio>
    <v-row class="justify-center m-4">
      <check-permission-role v-if="isMinistry" :role="Role.AESTReports">
        <template #="{ notAllowed }">
          <v-btn color="primary" @click="submitForm" :disabled="notAllowed"
            >Export CSV file</v-btn
          >
        </template>
      </check-permission-role>
      <v-btn v-else color="primary" @click="submitForm" :disabled="!isBCPublic"
        >Export CSV file</v-btn
      ></v-row
    >
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import {
  useSnackBar,
  useFileUtils,
  useFormioDropdownLoader,
  useFormioUtils,
} from "@/composables";
import { FormIOForm, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
  },
  props: {
    isMinistry: { type: Boolean, required: false },
    isBCPublic: { type: Boolean, required: false },
    title: { type: String, required: true },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const fileUtils = useFileUtils();
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const REPORT_TYPE_DROPDOWN_KEY = "selectedReportType";
    let formData: FormIOForm;
    const formLoaded = async (form: FormIOForm) => {
      formData = form;
      console.log("Form: ", form);
      const dropdown = formioUtils.getComponent(form, REPORT_TYPE_DROPDOWN_KEY);
      console.log("Dropdown: ", dropdown);
      await formioDataLoader.loadReportTypes(
        form,
        REPORT_TYPE_DROPDOWN_KEY,
        props.isMinistry,
      );
    };
    const submitForm = () => {
      return formData.submit();
    };
    const exportReport = async (data: ReportsFilterAPIInDTO) => {
      try {
        await fileUtils.downloadReports(data);
      } catch {
        snackBar.error("Unexpected error while downloading the report.");
      }
    };
    return { exportReport, formLoaded, submitForm, Role };
  },
});
</script>
