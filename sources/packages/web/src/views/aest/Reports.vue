<template>
  <v-container>
    <div class="mb-4">
      <header-navigator title="Ministry" subTitle="Reports" />
    </div>
  </v-container>
  <full-page-container>
    <body-header title="Export financial reports" />
    <formio
      formName="exportfinancialreports"
      @loaded="formLoaded"
      @submitted="exportCSVReport"
    ></formio>
    <v-row class="justify-center m-4"
      ><v-btn color="primary" @click="submitForm">Export CSV file</v-btn></v-row
    >
  </full-page-container>
</template>

<script lang="ts">
export default {
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    let formData: any = undefined;

    const formLoaded = (form: any) => {
      formData = form;
    };

    const submitForm = () => {
      return formData.submit();
    };

    const exportCSVReport = async (data: any) => {
      console.log(data);
    };
    return { exportCSVReport, formLoaded, submitForm };
  },
};
</script>
