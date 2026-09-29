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
  EducationProgramDynamicAPIOutDTO,
} from "@/services/http/dto";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { programFormRenderers } from "@/renderers/jsonforms";
import {
  getRequiredErrorsPerProperty,
  programFormAjv,
} from "@/renderers/jsonforms/ajv";
import { JsonSchema, UISchemaElement, ValidationMode } from "@jsonforms/core";
import { ErrorMessage } from "@/types";

interface ProgramFormProps {
  programId?: number;
  isBCPublic?: boolean;
  isBCPrivate?: boolean;
  readOnly?: boolean;
  isProcessing?: boolean;
}

const loading = ref(true);
const snackBar = useSnackBar();
const props = withDefaults(defineProps<ProgramFormProps>(), {
  programId: undefined,
  isBCPublic: undefined,
  isBCPrivate: undefined,
  readOnly: true,
  isProcessing: false,
});
const emit = defineEmits<{
  cancel: [];
  submitted: [program: EducationProgramDynamicAPIOutDTO];
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

const programFormErrors = ref<JsonFormsChangeEvent["errors"]>([]);
const onProgramFormChange = (event: JsonFormsChangeEvent) => {
  programFormErrors.value = event.errors;
  if (JSON.stringify(event.data) === JSON.stringify(formModel.value)) {
    return;
  }
  formModel.value = event.data;
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
  // The context is only used for the validations and is never submitted.
  const programData = { ...formModel.value };
  delete programData.context;
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
      await EducationProgramService.shared.getEducationProgramDynamic(
        programId,
      );
    formModel.value = programDetails.programData;
    programFormSchema.value = programDetails.validationSchema as JsonSchema;
    programFormUiSchema.value = programDetails.visualSchema as UISchemaElement;
    emit("loaded", programDetails);
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};
watchEffect(async () => {
  if (props.programId) {
    await loadProgram(props.programId);
  } else {
    loading.value = true;
    // When the program ID is not provided, some of the form context values are required to initialize the form.
    // Set before the schemas so the first validation already runs with the right context.
    // A program being created has no offerings yet and is active.
    const context: EducationProgramContextAPIOutDTO = {
      hasOfferings: false,
      isActive: true,
      isBCPublic: !!props.isBCPublic,
      isBCPrivate: !!props.isBCPrivate,
      isBCInstitution: !!props.isBCPrivate || !!props.isBCPublic,
    };
    formModel.value = { context };
    const programConfiguration =
      await EducationProgramService.shared.getEducationProgramConfiguration(
        100,
      );
    programFormSchema.value =
      programConfiguration.validationSchema as JsonSchema;
    programFormUiSchema.value =
      programConfiguration.visualSchema as UISchemaElement;
    loading.value = false;
  }
});
</script>
