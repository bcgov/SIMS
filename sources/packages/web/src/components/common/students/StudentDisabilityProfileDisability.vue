<template>
  <v-expansion-panel
    collapse-icon="$expanderCollapseIcon"
    expand-icon="$expanderExpandIcon"
    eager
  >
    <template #title>
      <div class="d-flex align-center justify-space-between w-100">
        <div>
          <span
            class="category-header-medium primary-color"
            :class="hasValidationErrors ? 'text-error' : 'brand-gray-text'"
          >
            {{ disabilityCategoryLabel }}
          </span>
          <div>
            {{ disabilityTypeLabel }}
          </div>
        </div>
        <v-btn-group
          :style="{ minWidth: 'fit-content' }"
          v-if="!readOnly && maxDisabilityPriority > 1"
          rounded="lg"
          :border="true"
          class="mr-4"
          density="compact"
          variant="text"
          :divided="true"
          color="primary"
        >
          <v-btn
            prepend-icon="mdi-arrow-up"
            @click.stop="$emit('moveUp')"
            v-if="!isPrimaryDisability"
            >Up</v-btn
          >
          <v-btn
            prepend-icon="mdi-arrow-down"
            @click.stop="$emit('moveDown')"
            v-if="!isLastDisability"
            >Down</v-btn
          >
          <v-btn
            prepend-icon="mdi-delete"
            @click.stop="$emit('deleteDisability')"
            >Delete</v-btn
          >
        </v-btn-group>
      </div>
    </template>
    <v-expansion-panel-text>
      <v-form ref="disabilityForm">
        <body-header-container
          header-size="medium"
          header-color="secondary"
          title="Disability details"
        >
          <content-group>
            <v-row density="compact">
              <v-col cols="6">
                <v-select
                  :readonly="readOnly"
                  v-model="selectedDisabilityCategory"
                  :items="disabilityCategoryLookup"
                  label="Disability category"
                  item-title="lookupValue"
                  item-value="lookupKey"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  :clearable="!readOnly"
                  :rules="[
                    (v) => checkNullOrEmptyRule(v, 'Disability category'),
                  ]"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  :readonly="readOnly"
                  v-model="selectedDisabilityType"
                  :items="disabilityTypeLookup"
                  label="Disability type"
                  item-title="lookupValue"
                  item-value="lookupKey"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  :clearable="!readOnly"
                  :rules="[(v) => checkNullOrEmptyRule(v, 'Disability type')]"
                />
              </v-col>
              <v-col class="mt-4" v-if="disabilityNotes || !readOnly"
                ><v-textarea
                  :readonly="readOnly"
                  v-model.trim="disabilityNotes"
                  label="Disability details notes"
                  variant="outlined"
                  :rows="readOnly ? 1 : undefined"
                  auto-grow
                  hide-details="auto"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        REGULAR_NOTE_MAX_LENGTH,
                        'Disability details notes',
                        selectedDisabilityCategory === OTHER_CATEGORY_KEY,
                      ),
                  ]"
              /></v-col>
            </v-row>
          </content-group>
        </body-header-container>
        <body-header-container
          title="Diagnosis information"
          header-size="medium"
          header-color="secondary"
          sub-title="Please add each diagnosis relevant to the student's disability."
          :hide-sub-title="readOnly"
        >
          <content-group>
            <v-row density="compact">
              <v-col cols="12">
                <student-disability-profile-diagnosis
                  v-model="diagnosisItems"
                  :read-only="readOnly"
                />
              </v-col>
              <v-col class="mt-4" v-if="diagnosisNotes || !readOnly"
                ><v-textarea
                  :readonly="readOnly"
                  v-model.trim="diagnosisNotes"
                  label="Diagnosis notes"
                  variant="outlined"
                  :rows="readOnly ? 1 : undefined"
                  auto-grow
                  hide-details="auto"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        REGULAR_NOTE_MAX_LENGTH,
                        'Diagnosis notes',
                        false,
                      ),
                  ]"
              /></v-col>
            </v-row>
          </content-group>
        </body-header-container>
        <body-header-container
          header-size="medium"
          header-color="secondary"
          title="Impairments to academic tasks"
          sub-title="Please select all that apply."
          :hide-sub-title="readOnly"
        >
          <content-group>
            <v-row density="compact" no-gutters>
              <v-col
                v-for="option in impairmentLookup"
                :key="option.lookupKey"
                cols="12"
                sm="6"
                class="py-0"
              >
                <v-checkbox
                  :readonly="readOnly"
                  :color="readOnly ? 'secondary' : 'primary'"
                  v-model="selectedImpairments"
                  :label="option.lookupValue"
                  :value="option.lookupKey"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-input
                  :model-value="selectedImpairments"
                  :rules="[
                    (v) =>
                      v.length > 0 ||
                      'At least one impairment must be selected.',
                  ]"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" v-if="impairmentsNotes || !readOnly"
                ><v-textarea
                  class="mt-4"
                  :readonly="readOnly"
                  v-model.trim="impairmentsNotes"
                  label="Impairments notes"
                  variant="outlined"
                  :rows="readOnly ? 1 : undefined"
                  auto-grow
                  hide-details="auto"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        REGULAR_NOTE_MAX_LENGTH,
                        'Impairments notes',
                        selectedImpairments.includes(OTHER_CATEGORY_KEY),
                      ),
                  ]"
              /></v-col>
            </v-row>
          </content-group>
        </body-header-container>
        <body-header-container
          v-if="finalNotes || !readOnly"
          title="Final notes"
          header-size="medium"
          header-color="secondary"
        >
          <v-textarea
            :readonly="readOnly"
            v-model.trim="finalNotes"
            label="Notes"
            variant="outlined"
            :rows="readOnly ? 1 : undefined"
            auto-grow
            hide-details="auto"
            :rules="[
              (v) =>
                checkLengthRule(
                  v,
                  FINAL_NOTES_MAX_LENGTH,
                  'Final notes',
                  false,
                ),
            ]"
          />
        </body-header-container>
      </v-form>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from "vue";
import { useRules, useSnackBar } from "@/composables";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";
import type { SystemLookupEntryAPIOutDTO } from "@/services/http/dto";
import {
  SystemLookupCategory,
  type StudentDisability,
  type VForm,
} from "@/types";
import StudentDisabilityProfileDiagnosis from "@/components/common/students/StudentDisabilityProfileDiagnosis.vue";

const OTHER_CATEGORY_KEY = "OTHER";
const REGULAR_NOTE_MAX_LENGTH = 500;
const FINAL_NOTES_MAX_LENGTH = 1000;

interface Props {
  maxDisabilityPriority: number;
  modelValue: StudentDisability;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: StudentDisability];
  moveUp: [];
  moveDown: [];
  deleteDisability: [];
}>();

const snackBar = useSnackBar();
const { checkNullOrEmptyRule, checkLengthRule } = useRules();
const disabilityForm = ref({} as VForm);
const hasValidationErrors = ref(false);
const isLookupLoaded = ref(false);
const disabilityCategoryLookup = ref<SystemLookupEntryAPIOutDTO[]>();
const disabilityTypeLookup = ref<SystemLookupEntryAPIOutDTO[]>();
const impairmentLookup = ref<SystemLookupEntryAPIOutDTO[]>();

// Local reactive copies initialized from the model prop.
const selectedDisabilityCategory = ref(props.modelValue.disabilityCategory);
const selectedDisabilityType = ref(props.modelValue.disabilityType);
const disabilityNotes = ref(props.modelValue.disabilityNotes ?? "");
const diagnosisItems = ref<string[]>([...props.modelValue.diagnosis]);
const diagnosisNotes = ref(props.modelValue.diagnosisNotes ?? "");
const selectedImpairments = ref<string[]>([...props.modelValue.impairments]);
const impairmentsNotes = ref(props.modelValue.impairmentsNotes ?? "");
const finalNotes = ref(props.modelValue.finalNotes ?? "");

/**
 * User friendly label for the selected disability category,
 * or a placeholder if none is selected.
 */
const disabilityCategoryLabel = computed(() => {
  const category = disabilityCategoryLookup.value?.find(
    (lookupItem) => lookupItem.lookupKey === selectedDisabilityCategory.value,
  );
  const disabilityCategory = category
    ? category.lookupValue
    : "Select disability category";
  if (hasValidationErrors.value) {
    return `${disabilityCategory} *`;
  }
  return disabilityCategory;
});

/**
 * Primary disability has different labels and action button rules.
 * All other disabilities are considered "additional".
 */
const isPrimaryDisability = computed(
  () => props.modelValue.disabilityPriority === 1,
);

/**
 * Last disability has action button rules.
 */
const isLastDisability = computed(
  () => props.modelValue.disabilityPriority === props.maxDisabilityPriority,
);

/**
 * User friendly label for the selected disability type,
 * or a placeholder if none is selected.
 */
const disabilityTypeLabel = computed(() => {
  const type = disabilityTypeLookup.value?.find(
    (lookupItem) => lookupItem.lookupKey === selectedDisabilityType.value,
  );
  const disabilityPriorityType = isPrimaryDisability.value
    ? "Primary disability"
    : "Additional disability";
  const disabilityType = type ? type.lookupValue : "Select disability type";
  return `${disabilityPriorityType} - ${disabilityType}`;
});

/**
 * Emit the full updated model to the parent whenever any field changes.
 * Also triggers validation to update the error highlight state of the panel.
 */
const emitUpdate = async (): Promise<void> => {
  emit("update:modelValue", {
    ...props.modelValue,
    disabilityCategory: selectedDisabilityCategory.value,
    disabilityType: selectedDisabilityType.value,
    disabilityNotes: disabilityNotes.value || undefined,
    diagnosis: diagnosisItems.value,
    diagnosisNotes: diagnosisNotes.value || undefined,
    impairments: selectedImpairments.value,
    impairmentsNotes: impairmentsNotes.value || undefined,
    finalNotes: finalNotes.value || undefined,
  });
  if (!hasValidationErrors.value) {
    // Avoid validating on every change when the validation error was not validated yet.
    // It will prevent to trigger validation before the user has a chance to fill in the form.
    return;
  }
  await nextTick();
  await validateDisabilityData();
};

watch(
  [
    selectedDisabilityCategory,
    selectedDisabilityType,
    disabilityNotes,
    diagnosisItems,
    diagnosisNotes,
    selectedImpairments,
    impairmentsNotes,
    finalNotes,
  ],
  emitUpdate,
  { deep: true },
);

/**
 * Load lookup values for disability categories, types, and impairments.
 */
const loadLookup = async (): Promise<void> => {
  try {
    const [disabilityCategory, disabilityType, disabilityImpairment] =
      await Promise.all([
        SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.DisabilityCategory,
        ),
        SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.DisabilityType,
        ),
        SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.DisabilityImpairment,
        ),
      ]);
    disabilityCategoryLookup.value = disabilityCategory.items;
    disabilityTypeLookup.value = disabilityType.items;
    impairmentLookup.value = disabilityImpairment.items;
    isLookupLoaded.value = true;
  } catch {
    snackBar.error("Unexpected error while loading data.");
  }
};

/**
 * Validates the panel form and updates the panel error highlight state.
 * @returns True when panel form is valid.
 */
const validateDisabilityData = async (): Promise<boolean> => {
  const validationResult = await disabilityForm.value.validate();
  hasValidationErrors.value = !validationResult.valid;
  return validationResult.valid;
};

/**
 * Clears the panel validation highlight state.
 */
const clearValidation = (): void => {
  hasValidationErrors.value = false;
};

defineExpose({
  validateDisabilityData,
  clearValidation,
});

watchEffect(async () => {
  await loadLookup();
});
</script>
