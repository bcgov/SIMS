<template>
  <v-text-field
    v-if="control.visible"
    :model-value="control.data"
    density="compact"
    variant="outlined"
    :label="control.label"
    :loading="calculating"
    readonly
    :error-messages="control.errors ? [control.errors] : []"
  />
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  rendererProps,
  useJsonFormsControl,
  useJsonForms,
} from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { EducationProgramService } from "@/services/EducationProgramService";
import { ProgramCalculatedDataKey } from "@/types";
import { CIP_CODE_REGEX } from "@/constants/program-constants";
import { useSnackBar } from "@/composables";
import { useClearDataWhenHidden } from "./useClearDataWhenHidden";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);
const snackBar = useSnackBar();
// Gives access to the whole form's data, not just this field - needed to
// read the sibling values this calculation depends on (mirrors
// calculateFieldOfStudyCode's original dependency on formModel.credentialType
// and formModel.cipCode).
const jsonforms = useJsonForms();

const credentialType = computed(
  () => jsonforms.core?.data?.credentialType as string | undefined,
);
const cipCode = computed(
  () => jsonforms.core?.data?.cipCode as string | undefined,
);
const visible = computed(() => control.value.visible);
const calculating = ref(false);

// Visibility is also watched so the value cleared while hidden is
// calculated again once the field is shown.
watch(
  [credentialType, cipCode, visible],
  async ([newCredentialType, newCipCode, isVisible], _, onCleanup) => {
    // Invoked before the next watcher run (or on unmount), so a pending
    // evaluation from previous selections never overwrites the current result
    // or clears the loading indicator of a newer evaluation.
    let isStale = false;
    onCleanup(() => {
      isStale = true;
      calculating.value = false;
    });
    // Not calculated while hidden, otherwise the result would bring back
    // the value cleared by useClearDataWhenHidden.
    if (
      control.value.readonly ||
      !isVisible ||
      !newCredentialType ||
      !newCipCode ||
      !CIP_CODE_REGEX.test(newCipCode)
    ) {
      return;
    }
    calculating.value = true;
    try {
      const evaluationResult = await EducationProgramService.shared.evaluate({
        data: jsonforms.core?.data,
        calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
      });
      if (isStale) {
        return;
      }
      handleChange(
        control.value.path,
        evaluationResult.calculatedData[
          ProgramCalculatedDataKey.FieldOfStudyCode
        ],
      );
    } catch {
      if (isStale) {
        return;
      }
      // Avoid showing a code calculated from previous selections.
      handleChange(control.value.path, undefined);
      snackBar.error("Unable to calculate the field of study code.");
    } finally {
      if (!isStale) {
        calculating.value = false;
      }
    }
  },
);

useClearDataWhenHidden(
  visible,
  computed(() => control.value.path),
  handleChange,
);
</script>
