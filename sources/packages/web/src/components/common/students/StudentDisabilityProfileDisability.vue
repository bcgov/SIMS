<template>
  <v-expansion-panel
    eager
    :class="{ 'disability-panel-error': hasValidationErrors }"
  >
    <template #title>
      <div class="d-flex align-center justify-space-between w-100">
        <div>
          <span class="category-header-medium brand-gray-text">
            {{ disabilityCategoryLabel }}
          </span>
          <div>
            {{
              isPrimaryDisability
                ? "Primary disability"
                : "Additional disability"
            }}
            - {{ disabilityTypeLabel }}
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
      <v-form ref="panelForm">
        <content-group>
          <v-row dense>
            <v-col cols="12">
              <h4 class="category-header-medium brand-gray-text mb-0">
                Disability details
              </h4>
              <v-divider></v-divider>
            </v-col>
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
                clearable
                :rules="[(v) => checkNullOrEmptyRule(v, 'Disability category')]"
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
                clearable
                :rules="[(v) => checkNullOrEmptyRule(v, 'Disability type')]"
              />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="disabilityNotes"
                label="Disability details notes"
                variant="outlined"
                rows="3"
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
          <v-row dense>
            <v-col cols="12"
              ><h4 class="category-header-medium brand-gray-text mb-0 mt-4">
                Diagnosis
              </h4>
              <v-divider></v-divider
            ></v-col>
            <v-col cols="12"
              ><v-text-field
                v-model="diagnosisText"
                :readonly="readOnly"
                label="Diagnosis information"
                placeholder="Enter diagnosis details..."
                density="compact"
                variant="outlined"
                hide-details="auto"
                :rules="[
                  (v) =>
                    checkLengthRule(v, 100, 'Diagnosis information', false),
                ]"
            /></v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="diagnosisNotes"
                label="Diagnosis notes"
                variant="outlined"
                rows="3"
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
          <v-row dense>
            <v-col cols="12">
              <h4 class="category-header-medium brand-gray-text mb-0 mt-4">
                Impairments
              </h4>
              <v-divider />
            </v-col>
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
                    v.length > 0 || 'At least one impairment must be selected.',
                ]"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="impairmentsNotes"
                label="Impairments notes"
                variant="outlined"
                rows="3"
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
          <v-row dense>
            <v-col cols="12">
              <h4 class="category-header-medium brand-gray-text mb-0 mt-4">
                Additional notes
              </h4>
              <v-divider />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="additionalNotes"
                label="Notes"
                variant="outlined"
                rows="3"
                hide-details="auto"
                :rules="[
                  (v) =>
                    checkLengthRule(
                      v,
                      ADDITIONAL_NOTE_MAX_LENGTH,
                      'Additional notes',
                      false,
                    ),
                ]"
            /></v-col>
          </v-row>
        </content-group>
      </v-form>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
import { useRules, useSnackBar } from "@/composables";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";
import type { SystemLookupEntryAPIOutDTO } from "@/services/http/dto";
import {
  SystemLookupCategory,
  type StudentDisability,
  type VForm,
} from "@/types";

const OTHER_CATEGORY_KEY = "OTHER";
const REGULAR_NOTE_MAX_LENGTH = 500;
const ADDITIONAL_NOTE_MAX_LENGTH = 1000;

interface Props {
  studentId: number;
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
const panelForm = ref({} as VForm);
const hasValidationErrors = ref(false);
const isLookupLoaded = ref(false);
const disabilityCategoryLookup = ref<SystemLookupEntryAPIOutDTO[]>();
const disabilityTypeLookup = ref<SystemLookupEntryAPIOutDTO[]>();
const impairmentLookup = ref<SystemLookupEntryAPIOutDTO[]>();

// Local reactive copies initialized from the model prop.
const selectedDisabilityCategory = ref(props.modelValue.disabilityCategory);
const selectedDisabilityType = ref(props.modelValue.disabilityType);
const disabilityNotes = ref(props.modelValue.disabilityNotes ?? "");
const diagnosisText = ref(props.modelValue.diagnosis);
const diagnosisNotes = ref(props.modelValue.diagnosisNotes ?? "");
const selectedImpairments = ref<string[]>([...props.modelValue.impairments]);
const impairmentsNotes = ref(props.modelValue.impairmentsNotes ?? "");
const additionalNotes = ref(props.modelValue.additionalNotes ?? "");

const disabilityCategoryLabel = computed(() => {
  const category = disabilityCategoryLookup.value?.find(
    (lookupItem) => lookupItem.lookupKey === selectedDisabilityCategory.value,
  );
  return category ? category.lookupValue : "Select disability category";
});

const disabilityTypeLabel = computed(() => {
  const type = disabilityTypeLookup.value?.find(
    (lookupItem) => lookupItem.lookupKey === selectedDisabilityType.value,
  );
  return type ? type.lookupValue : "Select disability type";
});

const isPrimaryDisability = computed(
  () => props.modelValue.disabilityPriority === 1,
);

const isLastDisability = computed(
  () => props.modelValue.disabilityPriority === props.maxDisabilityPriority,
);

// Emit the full updated model to the parent whenever any field changes.
const emitUpdate = (): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    disabilityCategory: selectedDisabilityCategory.value,
    disabilityType: selectedDisabilityType.value,
    disabilityNotes: disabilityNotes.value || undefined,
    diagnosis: diagnosisText.value,
    diagnosisNotes: diagnosisNotes.value || undefined,
    impairments: selectedImpairments.value,
    impairmentsNotes: impairmentsNotes.value || undefined,
    additionalNotes: additionalNotes.value || undefined,
  });
};

watch(
  [
    selectedDisabilityCategory,
    selectedDisabilityType,
    disabilityNotes,
    diagnosisText,
    diagnosisNotes,
    selectedImpairments,
    impairmentsNotes,
    additionalNotes,
  ],
  emitUpdate,
  { deep: true },
);

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

watchEffect(() => {
  void loadLookup();
});

/**
 * Validates the panel form and updates the panel error highlight state.
 * @returns True when panel form is valid.
 */
const validatePanel = async (): Promise<boolean> => {
  const validationResult = await panelForm.value.validate();
  hasValidationErrors.value = !validationResult.valid;
  return validationResult.valid;
};

/**
 * Clears the panel validation highlight state.
 */
const clearValidationPanelHighlight = (): void => {
  hasValidationErrors.value = false;
};

defineExpose({
  validatePanel,
  clearValidationPanelHighlight,
});
</script>

<style scoped>
.disability-panel-error :deep(.v-expansion-panel-title) {
  background-color: rgba(var(--v-theme-error), 0.08) !important;
}
</style>
