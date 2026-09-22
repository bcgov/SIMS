<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { rendererProps, useJsonFormsControl, useJsonForms } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);
// Gives access to the whole form's data, not just this field - needed to
// read the sibling values this calculation depends on.
const jsonforms = useJsonForms();

// POC stand-in for the real dependency lookup done today in ProgramForm.vue
// (see calculateFieldOfStudyCode), which reads formModel.credentialType and
// formModel.cipCode.
const credentialType = computed(() => jsonforms.core.data?.credentialType);
const cipCode = computed(() => jsonforms.core.data?.cipCode);
const calculating = ref(false);

/**
 * POC stand-in for EducationProgramService.shared.evaluate(...). Simulates
 * network latency so the recalculation-on-dependency-change behaviour is
 * visible. In a real implementation this would be replaced by the actual
 * API call, unchanged from how it already works in ProgramForm.vue today.
 */
const mockEvaluateFieldOfStudyCode = (
  newCredentialType: string,
  newCipCode: string,
) =>
  new Promise<number>((resolve) => {
    setTimeout(() => {
      let hash = 0;
      const combined = `${newCredentialType}-${newCipCode}`;
      for (let i = 0; i < combined.length; i++) {
        hash = (hash * 31 + combined.charCodeAt(i)) % 10000;
      }
      resolve(hash);
    }, 400);
  });

watch([credentialType, cipCode], async ([newCredentialType, newCipCode]) => {
  if (!newCredentialType || !newCipCode) {
    return;
  }
  calculating.value = true;
  try {
    const calculatedValue = await mockEvaluateFieldOfStudyCode(
      newCredentialType as string,
      newCipCode as string,
    );
    handleChange(control.value.path, calculatedValue);
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
