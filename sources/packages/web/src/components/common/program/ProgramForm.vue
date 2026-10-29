<template>
  <body-header-container title="Program"
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
          :readonly="isReadonly"
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
import { computed, nextTick, ref, useTemplateRef, watchEffect } from "vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  CreateEducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  UpdateEducationProgramAPIInDTO,
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
   * ID of the program to be edited.
   * If not provided, a new program will be created.
   */
  programId?: number;
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
  programId: undefined,
  readOnly: true,
  isProcessing: false,
});
const emit = defineEmits<{
  cancel: [];
  create: [program: CreateEducationProgramAPIInDTO];
  update: [program: UpdateEducationProgramAPIInDTO];
  loaded: [program: EducationProgramAPIOutDTO];
}>();

const loading = ref(true);
const snackBar = useSnackBar();
const errorSummary =
  useTemplateRef<InstanceType<typeof ErrorSummary>>("errorSummary");

/**
 * Program configuration ID used when creating a new program.
 * Currently the most recent program configuration is used for creation,
 * later, the configuration must be explicitly selected by the user.
 */
let programConfigurationIdForCreation: number | undefined;

const formModel = ref({} as EducationProgramDataAPIOutDTO);

/**
 * Indicates whether the loaded program can no longer be edited
 * because it is inactive or expired. Always false for creation.
 */
const isProgramInactive = ref(false);

const isReadonly = computed(() => props.readOnly || isProgramInactive.value);

// Errors are always computed; only shown once the user tries to submit.
const validationMode = ref<ValidationMode>("ValidateAndHide");
const programFormSchema = ref<JsonSchema>({} as JsonSchema);
const programFormUiSchema = ref<UISchemaElement>({} as UISchemaElement);

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
  if (props.programId) {
    emit("update", { programData });
  } else if (programConfigurationIdForCreation) {
    emit("create", {
      programData,
      programConfigurationId: programConfigurationIdForCreation,
    });
  } else {
    snackBar.error("Unable to create program: missing program configuration.");
  }
};

const loadProgram = async (programId: number) => {
  try {
    loading.value = true;
    const programDetails =
      await EducationProgramService.shared.getEducationProgram(programId);
    programFormSchema.value = programDetails.validationSchema as JsonSchema;
    programFormUiSchema.value = programDetails.visualSchema as UISchemaElement;
    isProgramInactive.value =
      !programDetails.isActive || programDetails.isExpired;
    // Set after the schema, since the flags are declared by it.
    formModel.value = withFlags(programDetails.programData);
    emit("loaded", programDetails);
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};

const loadProgramForCreation = async () => {
  try {
    loading.value = true;
    // Load the most recent active program configuration for creation.
    const programConfiguration =
      await EducationProgramService.shared.getEducationProgramConfiguration();
    programConfigurationIdForCreation = programConfiguration.configurationId;
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
  await loadProgramForCreation();
});
</script>
