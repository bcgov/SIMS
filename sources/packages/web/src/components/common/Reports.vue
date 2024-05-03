<template>
  <body-header title="Export reports" />
  <formio
    formName="exportfinancialreports"
    @loaded="formLoaded"
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
} from "@/composables";
import { FormIOForm, Role } from "@/types";
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
    const REPORT_TYPE_DROPDOWN_KEY = "reportName";
    const loading = ref(false);
    let formData: FormIOForm;
    const formLoaded = async (form: FormIOForm) => {
      formData = form;
      await formioDataLoader.loadDropdown(
        formData,
        REPORT_TYPE_DROPDOWN_KEY,
        props.reportList,
      );
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
    return { exportReport, formLoaded, submitForm, Role, loading };
  },
});
</script>
