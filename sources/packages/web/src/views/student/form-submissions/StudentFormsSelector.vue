<template>
  <template v-if="!!applicationId">
    <student-forms-selector-appeals-section
      :forms-configurations="formConfigurations"
      :application-id="applicationId"
    />
    <student-forms-selector-form-section
      :forms-configurations="formConfigurations"
    />
  </template>
  <template v-else>
    <student-forms-selector-form-section
      :forms-configurations="formConfigurations"
    />
    <student-forms-selector-appeals-section
      :forms-configurations="formConfigurations"
      :application-id="applicationId"
    />
  </template>
</template>
<script lang="ts">
import { useSnackBar } from "@/composables";
import { defineComponent, onMounted, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import StudentFormsSelectorAppealsSection from "./StudentFormsSelectorAppealsSection.vue";
import StudentFormsSelectorFormSection from "./StudentFormsSelectorFormsSection.vue";

export default defineComponent({
  components: {
    StudentFormsSelectorAppealsSection,
    StudentFormsSelectorFormSection,
  },
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup() {
    const snackBar = useSnackBar();
    const formConfigurations = ref<FormSubmissionConfigurationAPIOutDTO[]>([]);

    onMounted(async () => {
      try {
        const formsConfigs =
          await FormSubmissionsService.shared.getSubmissionForms();
        formConfigurations.value = formsConfigs.configurations;
      } catch {
        snackBar.error("Unexpected error while loading forms configurations.");
      }
    });

    return {
      formConfigurations,
      StudentRoutesConst,
    };
  },
});
</script>
