<template>
  <body-header-container :title="title"
    ><content-group>
      <error-summary ref="errorSummary" :errors="errorSummaryMessages" />
      <v-skeleton-loader :loading="loading" type="article, text@5">
        <json-forms
          :data="formModel"
          :schema="programFormSchema"
          :uischema="programFormUiSchema"
          :renderers="PROGRAM_FORM_RENDERERS"
          :validation-mode="validationMode"
          :additional-errors="requiredErrorsPerProperty"
          :ajv="programFormAjv"
          :readonly="readOnly"
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
      v-if="!readOnly && !loading"
    />
  </body-header-container>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import {
  EducationProgramConfigurationAPIOutDTO,
  EducationProgramDataAPIOutDTO,
} from "@/services/http/dto";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { PROGRAM_FORM_RENDERERS } from "@/components/renderers/jsonforms/formRenderers";
import {
  createFlagsCalculator,
  getRequiredErrorsPerProperty,
  programFormAjv,
  sortErrorsByUISchema,
} from "@/components/renderers/jsonforms/ajv";
import { JsonSchema, UISchemaElement, ValidationMode } from "@jsonforms/core";
import { ErrorMessage } from "@/types";

interface ProgramFormProps {
  /**
   * Title displayed in the form header.
   */
  title?: string;
  /**
   * Program configuration providing the validation and visual schemas,
   * the program data used to create the form model, and the program year.
   */
  programConfiguration?: EducationProgramConfigurationAPIOutDTO;
  /**
   * Indicates whether the consumer is still loading the form data.
   */
  loading?: boolean;
  /**
   * Indicates whether the form is read-only.
   */
  readOnly?: boolean;
  /**
   * Indicates whether the form is currently processing a submission.
   * Allows control of the loading from the consumer that is submitting the form.
   */
  isProcessing?: boolean;
}

const props = withDefaults(defineProps<ProgramFormProps>(), {
  title: "Program",
  programConfiguration: undefined,
  loading: false,
  readOnly: true,
  isProcessing: false,
});
const emit = defineEmits<{
  cancel: [];
  submit: [programData: Record<string, unknown>];
}>();

const errorSummary =
  useTemplateRef<InstanceType<typeof ErrorSummary>>("errorSummary");

/**
 * Form model holding the current state of the program data.
 * This includes both the user-entered data and the calculated flags.
 */
const formModel = ref({} as EducationProgramDataAPIOutDTO);
// Errors are always computed; only shown once the user tries to submit.
const validationMode = ref<ValidationMode>("ValidateAndHide");
const programFormSchema = computed(
  () => (props.programConfiguration?.validationSchema ?? {}) as JsonSchema,
);
const programFormUiSchema = computed(
  () => (props.programConfiguration?.visualSchema ?? {}) as UISchemaElement,
);

const calculateFlags = computed(() =>
  createFlagsCalculator(programFormSchema.value),
);

/**
 * Sets the flags triggered by the form data, which are used by the
 * UI schema rules to show the banners. Like the context, the
 * flags are never changed by the user and never submitted.
 * Calculated without the previous flags, the same way the server does.
 * @param data form data of type EducationProgramDataAPIOutDTO.
 * @returns form data with its triggered flags.
 */
const withFlags = (
  data: EducationProgramDataAPIOutDTO,
): EducationProgramDataAPIOutDTO => {
  const dataWithoutFlags = { ...data };
  delete dataWithoutFlags.flags;
  return { ...dataWithoutFlags, flags: calculateFlags.value(dataWithoutFlags) };
};

const programFormErrors = ref<JsonFormsChangeEvent["errors"]>([]);

const onProgramFormChange = (event: JsonFormsChangeEvent) => {
  programFormErrors.value = event.errors;
  const data = withFlags(event.data);
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

const errorSummaryMessages = computed<ErrorMessage[]>(() => {
  if (validationMode.value !== "ValidateAndShow") {
    return [];
  }
  // "if" errors only state that a "then" schema failed, which is already
  // reported by the "then" schema's own error.
  const errors = (programFormErrors.value ?? []).filter(
    (error) => error.keyword !== "if",
  );
  // Displayed in the same order as the controls on the screen.
  const messages = sortErrorsByUISchema(errors, programFormUiSchema.value).map(
    (error) => error.message ?? "",
  );
  return [...new Set(messages)].map((message) => ({
    errorMessages: [message],
  }));
});

const submit = async () => {
  validationMode.value = "ValidateAndShow";
  if (programFormErrors.value?.length) {
    // Wait for the summary to render before scrolling to it.
    await nextTick();
    errorSummary.value?.$el?.scrollIntoView?.({
      block: "center",
      behavior: "smooth",
    });
    return;
  }
  const programData = { ...formModel.value } as Record<string, unknown>;
  // The context and the flags are only used by the form and are never submitted.
  // Context and flags should be recalculated by the server.
  delete programData.context;
  delete programData.flags;
  emit("submit", programData);
};

// Recreates the form model whenever the consumer provides a new program configuration.
watch(
  () => props.programConfiguration,
  (programConfiguration) => {
    if (programConfiguration) {
      formModel.value = withFlags(programConfiguration.programData);
    }
  },
  { immediate: true },
);
</script>
