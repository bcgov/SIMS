<template>
  <student-forms-selector-form-section
    :forms-configurations="dynamicFormConfigurations"
  />
  <student-forms-selector-appeals-section
    :forms-configurations="dynamicFormConfigurations"
    :application-id="applicationId"
  />
</template>
<script lang="ts">
import { useSnackBar } from "@/composables";
import { defineComponent, onMounted, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { DynamicFormConfigurationAPIOutDTO } from "@/services/http/dto";
import { DynamicFormConfigurationService } from "@/services/DynamicFormConfigurationService";
import StudentFormsSelectorAppealsSection from "./StudentFormsSelectorAppealsSection.vue";
import StudentFormsSelectorFormSection from "./StudentFormsSelectorFormSection.vue";

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
    const dynamicFormConfigurations = ref<DynamicFormConfigurationAPIOutDTO[]>(
      [],
    );

    onMounted(async () => {
      try {
        const formsConfigs =
          await DynamicFormConfigurationService.shared.getDynamicFormConfigurationsByCategory();
        dynamicFormConfigurations.value = formsConfigs.configurations;
      } catch {
        snackBar.error("Unexpected error while loading eligible applications.");
      }
    });

    return {
      dynamicFormConfigurations,
      StudentRoutesConst,
    };
  },
});
</script>
