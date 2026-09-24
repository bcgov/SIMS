<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { rendererProps, useJsonFormsControl, useJsonForms } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { EducationProgramService } from "@/services/EducationProgramService";
import { ProgramCalculatedDataKey } from "@/types";
import { CIP_CODE_REGEX } from "@/constants/program-constants";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);
// Gives access to the whole form's data, not just this field - needed to
// read the sibling values this calculation depends on (mirrors
// calculateFieldOfStudyCode's original dependency on formModel.credentialType
// and formModel.cipCode).
const jsonforms = useJsonForms();

const credentialType = computed(
  () => jsonforms.core.data?.credentialType as string | undefined,
);
const cipCode = computed(() => jsonforms.core.data?.cipCode as string | undefined);
const calculating = ref(false);

watch([credentialType, cipCode], async ([newCredentialType, newCipCode]) => {
  if (
    control.value.readonly ||
    !newCredentialType ||
    !newCipCode ||
    !CIP_CODE_REGEX.test(newCipCode)
  ) {
    return;
  }
  calculating.value = true;
  try {
    const evaluationResult = await EducationProgramService.shared.evaluate({
      data: jsonforms.core.data,
      calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
    });
    handleChange(
      control.value.path,
      evaluationResult.calculatedData[ProgramCalculatedDataKey.FieldOfStudyCode],
    );
  } finally {
    calculating.value = false;
  }
});
</script>

<template>
  <v-text-field
    v-if="control.visible"
    :model-value="control.data"
    density="compact"
    variant="outlined"
    :label="control.label"
    :loading="calculating"
    readonly
  />
</template>
