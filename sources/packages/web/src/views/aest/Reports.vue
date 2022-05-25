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
    <v-row class="justify-center m-4"
      ><v-btn color="primary" @click="submitForm">Export CSV file</v-btn></v-row
    >
  </full-page-container>
</template>

<script lang="ts">
import { ReportService } from "@/services/ReportService";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { useToastMessage } from "@/composables";
import { FormIOForm } from "@/types";
export default {
  setup() {
    const toast = useToastMessage();
    let formData: any = undefined;

    const formLoaded = (form: FormIOForm) => {
      formData = form;
    };

    const submitForm = () => {
      return formData.submit();
    };

    const exportReport = async (data: ReportsFilterAPIInDTO) => {
      try {
        await ReportService.shared.exportReport(data);
      } catch (error: unknown) {
        toast.error(
          "Unexpected error",
          "Unexpected error while downloading the report.",
        );
      }
    };
    return { exportReport, formLoaded, submitForm };
  },
};
</script>
