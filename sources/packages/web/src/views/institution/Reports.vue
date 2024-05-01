<template>
  <Reports title="Institution" :reportType="ReportTypes.InstitutionReport" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { useSnackBar, useFileUtils, useInstitutionState } from "@/composables";
import { FormIOForm, Role } from "@/types";
import Reports from "@/components/common/Reports.vue";
import { ReportTypes } from "@/types/contracts/Reports";

export default defineComponent({
  components: {
    Reports,
  },
  setup() {
    const { institutionState } = useInstitutionState();
    const isBCPublic = institutionState.value.isBCPublic;
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
    return {
      exportReport,
      formLoaded,
      submitForm,
      ReportTypes,
      Role,
      isBCPublic,
    };
  },
});
</script>
@/types/contracts/Reports
