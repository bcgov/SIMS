<template>
  <body-header-container title="Program" :sub-title="programYearSubTitle"
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
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  CreateEducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  UpdateEducationProgramAPIInDTO,
  EducationProgramDataAPIOutDTO,
  EducationProgramConfigurationAPIOutDTO,
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
   * Indicates whether the form is for renewing a program.
   */
  isRenewal?: boolean;
  /**
   * ID of the program to be edited.
   * If not provided, a new program will be created.
   */
  programId?: number;
  /**
   * ID of the program configuration to be used when creating/renewing a program.
   */
  configurationId?: number;
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
  configurationId: undefined,
  isRenewal: false,
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

const selectedProgramConfiguration = ref<
  EducationProgramConfigurationAPIOutDTO | undefined
>(undefined);

/**
 * Program year of the loaded program configuration.
 */
const programYearSubTitle = computed(() => {
  if (selectedProgramConfiguration.value) {
    return `Program year ${selectedProgramConfiguration.value.programYearName}`;
  }
  return "";
});

/**
 * Form model holding the current state of the program data.
 * This includes both the user-entered data and the calculated flags.
 */
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
  if (props.isRenewal) {
    if (!selectedProgramConfiguration.value?.configurationId) {
      snackBar.error(
        "Unable to create program: missing program configuration.",
      );
      return;
    }
    emit("create", {
      programData,
      programConfigurationId:
        selectedProgramConfiguration.value.configurationId,
    });
  }
  if (props.configurationId) {
    emit("create", {
      programData,
      programConfigurationId: props.configurationId,
    });
  } else if (props.programId) {
    emit("update", { programData });
  } else {
    snackBar.error("Unable to create program: missing program configuration.");
  }
};

const loadProgram = async () => {
  try {
    loading.value = true;
    let programDetails: EducationProgramConfigurationAPIOutDTO | undefined;
    let programConfiguration:
      EducationProgramConfigurationAPIOutDTO | undefined;
    if (props.programId) {
      if (props.isRenewal) {
        programDetails =
          await EducationProgramService.shared.getEducationProgramForRenew(
            props.programId,
          );
      } else {
        const educationProgram =
          await EducationProgramService.shared.getEducationProgram(
            props.programId,
          );
        isProgramInactive.value =
          !educationProgram.isActive || educationProgram.isExpired;
        programDetails = educationProgram;
        emit("loaded", educationProgram);
      }
      programFormSchema.value = programDetails?.validationSchema as JsonSchema;
      programFormUiSchema.value =
        programDetails?.visualSchema as UISchemaElement;
      formModel.value = withFlags(programDetails.programData);
      selectedProgramConfiguration.value = programDetails;
    }
    if (props.configurationId) {
      programConfiguration =
        await EducationProgramService.shared.getEducationProgramConfiguration(
          props.configurationId,
        );
      programFormSchema.value =
        programConfiguration.validationSchema as JsonSchema;
      programFormUiSchema.value =
        programConfiguration.visualSchema as UISchemaElement;
      isProgramInactive.value = false;
      if (!props.programId) {
        formModel.value = withFlags(programConfiguration.programData);
      }
      selectedProgramConfiguration.value = programConfiguration;
    }
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};

watch(() => [props.programId, props.configurationId], loadProgram, {
  immediate: true,
});
</script>
