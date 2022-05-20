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
export default {
  setup() {
    let formData: any = undefined;

    const formLoaded = (form: any) => {
      formData = form;
    };

    const submitForm = () => {
      return formData.submit();
    };

    const exportReport = async (data: ReportsFilterAPIInDTO) => {
      await ReportService.shared.exportReport(data);
    };
    return { exportReport, formLoaded, submitForm };
  },
};
</script>
