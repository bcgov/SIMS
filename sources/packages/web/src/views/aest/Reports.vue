<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Ministry" subTitle="Reports" />
    </template>
    <body-header title="Export financial reports" />
    <formio
      formName="exportfinancialreports"
      @loaded="formLoaded"
      @submitted="exportReport"
    ></formio>
    <v-row class="justify-center m-4">
      <check-permission-role :role="Role.AESTReports">
        <template #="{ notAllowed }">
          <v-btn color="primary" @click="submitForm" :disabled="notAllowed"
            >Export CSV file</v-btn
          >
        </template>
      </check-permission-role></v-row
    >
  </full-page-container>
</template>

<script lang="ts">
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { useSnackBar, useFileUtils } from "@/composables";
import { FormIOForm, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: {
    CheckPermissionRole,
  },
  setup() {
    const snackBar = useSnackBar();
    const fileUtils = useFileUtils();
    let formData: FormIOForm;

    const formLoaded = (form: FormIOForm) => {
      formData = form;
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
};
</script>
