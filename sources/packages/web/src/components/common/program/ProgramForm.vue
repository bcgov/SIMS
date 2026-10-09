<template>
  <body-header-container title="Program"
    ><content-group>
      <error-summary :errors="errorSummaryMessages" />
      <v-skeleton-loader :loading="loading" type="article, text@5">
        <json-forms
          :data="formModel"
          :schema="programFormSchema"
          :uischema="programFormUiSchema"
          :renderers="programFormRenderers"
          :validation-mode="validationMode"
          :additional-errors="requiredErrorsPerProperty"
          :ajv="programFormAjv"
          :readonly="isProgramDetailReadonly"
          @change="onProgramFormChange"
        />
      </v-skeleton-loader>
    </content-group>
    <footer-buttons
      primary-label="Submit"
      @secondary-click="$emit('cancel')"
      @primary-click="submit"
      :disable-primary-button="isProcessing"
      :processing="isProcessing"
      v-if="!isReadonly && !loading"
    />
  </body-header-container>
</template>
<script setup lang="ts">
import { useSnackBar } from "@/composables";
import { computed, nextTick, ref, watchEffect } from "vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  EducationProgramAPIOutDTO,
  EducationProgramContextAPIOutDTO,
} from "@/services/http/dto";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { programFormRenderers } from "@/components/renderers/jsonforms";
import {
  createWarningsCalculator,
  getRequiredErrorsPerProperty,
  programFormAjv,
} from "@/components/renderers/jsonforms/ajv";
import { JsonSchema, UISchemaElement, ValidationMode } from "@jsonforms/core";
import { ErrorMessage } from "@/types";
import { defineProps, defineEmits, withDefaults } from "vue";

interface ProgramFormProps {
  programId?: number;
  programConfigurationId?: number;
  readOnly?: boolean;
  isProcessing?: boolean;
}

const loading = ref(true);
const snackBar = useSnackBar();
const props = withDefaults(defineProps<ProgramFormProps>(), {
  programId: undefined,
  programConfigurationId: undefined,
  readOnly: true,
  isProcessing: false,
});
const emit = defineEmits<{
  cancel: [];
  submitted: [program: EducationProgramAPIOutDTO];
  loaded: [program: EducationProgramAPIOutDTO];
}>();
const formModel = ref<Record<string, unknown>>({});
// The context is kept in the form data, never changed by the user, since the
// schemas' rules and validations depend on it.
const formContext = computed(
  () => formModel.value.context as EducationProgramContextAPIOutDTO | undefined,
);

// Errors are always computed; only shown once the user tries to submit.
const validationMode = ref<ValidationMode>("ValidateAndHide");

const isReadonly = computed(
  () => props.readOnly || (!!props.programId && !formContext.value?.isActive),
);
const isProgramDetailReadonly = computed(
  () => isReadonly.value || !!formContext.value?.hasOfferings,
);
const programFormSchema = ref<JsonSchema>({} as JsonSchema);
const programFormUiSchema = ref<UISchemaElement>({} as UISchemaElement);

const calculateWarnings = computed(() =>
  createWarningsCalculator(programFormSchema.value),
);
/**
 * Sets the warnings triggered by the form data, which are used by the
 * UI schema rules to show the warning banners. Like the context, the
 * warnings are never changed by the user and never submitted.
 * @param data form data.
 * @returns form data with its triggered warnings.
 */
const withWarnings = (
  data: Record<string, unknown>,
): Record<string, unknown> => ({
  ...data,
  warnings: calculateWarnings.value(data),
});

const programFormErrors = ref<JsonFormsChangeEvent["errors"]>([]);
const onProgramFormChange = (event: JsonFormsChangeEvent) => {
  programFormErrors.value = event.errors;
  const data = withWarnings(event.data);
  if (JSON.stringify(data) === JSON.stringify(formModel.value)) {
    return;
  }
  formModel.value = data;
};

// Custom "required" messages re-pointed at their properties, so each control
// can display its own. Only supplied once the errors are to be shown, since
// JSONForms shows additional errors even while validating and hiding.
const requiredErrorsPerProperty = computed(() =>
  validationMode.value === "ValidateAndShow"
    ? getRequiredErrorsPerProperty(programFormErrors.value)
    : [],
);

// Not named "errorSummary": <script setup> would resolve the <error-summary>
// tag to that variable instead of the ErrorSummary component.
const errorSummaryMessages = computed<ErrorMessage[]>(() => {
  if (validationMode.value !== "ValidateAndShow") {
    return [];
  }
  // "if" errors only state that a "then" failed, which is already reported
  // by the "then" own error.
  const messages = (programFormErrors.value ?? [])
    .filter((error) => error.keyword !== "if")
    .map((error) => error.message ?? "");
  return [...new Set(messages)].map((message) => ({
    errorMessages: [message],
  }));
});

const submit = async () => {
  validationMode.value = "ValidateAndShow";
  if (programFormErrors.value?.length) {
    // Wait for the summary to render before scrolling to it.
    await nextTick();
    document
      .getElementsByClassName("error-summary")[0]
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  // The context and the warnings are only used by the form and are never submitted.
  // Context and warnings should be recalculated by the server.
  const programData = { ...formModel.value };
  delete programData.context;
  delete programData.warnings;
  await EducationProgramService.shared.createEducationProgramDynamic({
    programConfigurationId: 6,
    programData,
  });
  //emit("submitted", programData);
};

const loadProgram = async (programId: number) => {
  try {
    loading.value = true;
    const programDetails =
      await EducationProgramService.shared.getEducationProgram(programId);
    programFormSchema.value = programDetails.validationSchema as JsonSchema;
    programFormUiSchema.value = programDetails.visualSchema as UISchemaElement;
    // Set after the schema, since the warnings are declared by it.
    formModel.value = withWarnings(programDetails.programData);
    emit("loaded", programDetails);
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};

const loadProgramForCreation = async (programConfigurationId: number) => {
  try {
    loading.value = true;
    const programConfiguration =
      await EducationProgramService.shared.getEducationProgramConfiguration(
        programConfigurationId,
      );
    programFormSchema.value =
      programConfiguration.validationSchema as JsonSchema;
    programFormUiSchema.value =
      programConfiguration.visualSchema as UISchemaElement;
    formModel.value = programConfiguration.programData;
  } catch {
    snackBar.error("Unexpected error while loading program configuration.");
  } finally {
    loading.value = false;
  }
};

watchEffect(async () => {
  if (props.programId) {
    await loadProgram(props.programId);
    return;
  }
  if (props.programConfigurationId) {
    await loadProgramForCreation(props.programConfigurationId);
    return;
  }
  throw new Error(
    "Either programId or programConfigurationId must be provided.",
  );
});
</script>
