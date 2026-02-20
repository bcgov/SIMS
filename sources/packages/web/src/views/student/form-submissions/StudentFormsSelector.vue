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
import { FormSubmissionService } from "@/services/FormSubmissionService";
import StudentFormsSelectorAppealsSection from "./StudentFormsSelectorAppealsSection.vue";
import StudentFormsSelectorFormSection from "./StudentFormsSelectorFormsSection.vue";
import { FormSubmissionConfigurationAPIOutDTO } from "@/services/http/dto";

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
          await FormSubmissionService.shared.getSubmissionForms();
        formConfigurations.value = formsConfigs.configurations;
      } catch {
        snackBar.error("Unexpected error while loading forms configurations.");
      }
    });

    return {
      formConfigurations,
    };
  },
});
</script>
