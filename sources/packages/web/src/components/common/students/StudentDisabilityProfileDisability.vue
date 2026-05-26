<template>
  <v-expansion-panel eager>
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
                  selectedDisabilityCategory !== 'OTHER' ||
                  checkLengthRule(
                    v,
                    500,
                    'Disability details notes',
                    selectedDisabilityCategory === 'OTHER',
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
                (v) => checkLengthRule(v, 100, 'Diagnosis information', false),
              ]"
          /></v-col>
          <v-col cols="12"
            ><v-textarea
              :readonly="readOnly"
              v-model="diagnosisNotes"
              label="Diagnosis notes"
              variant="outlined"
              rows="3"
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
              color="primary"
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
                    500,
                    'Impairments notes',
                    selectedImpairments.includes('OTHER'),
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
              hide-details
              :rules="[
                (v) => checkLengthRule(v, 'Additional notes', 1000, false),
              ]"
          /></v-col>
        </v-row>
      </content-group>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { ref, defineComponent, computed, watchEffect, watch } from "vue";
import { useRules, useSnackBar } from "@/composables";
import { SystemLookupEntryAPIOutDTO } from "@/services/http/dto";
import {
  BannerTypes,
  Role,
  StudentDisability,
  SystemLookupCategory,
} from "@/types";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    maxDisabilityPriority: {
      type: Number,
      required: true,
    },
    modelValue: {
      type: Object as () => StudentDisability,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ["update:modelValue", "moveUp", "moveDown", "deleteDisability"],
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const { checkNullOrEmptyRule, checkLengthRule } = useRules();
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
    const selectedImpairments = ref<string[]>([
      ...props.modelValue.impairments,
    ]);
    const impairmentsNotes = ref(props.modelValue.impairmentsNotes ?? "");
    const additionalNotes = ref(props.modelValue.additionalNotes ?? "");

    const disabilityCategoryLabel = computed(() => {
      const category = disabilityCategoryLookup.value?.find(
        (c) => c.lookupKey === selectedDisabilityCategory.value,
      );
      return category ? category.lookupValue : "Select disability category";
    });

    const disabilityTypeLabel = computed(() => {
      const type = disabilityTypeLookup.value?.find(
        (t) => t.lookupKey === selectedDisabilityType.value,
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
    const emitUpdate = () => {
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

    const loadLookup = async () => {
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
    watchEffect(loadLookup);

    return {
      isLookupLoaded,
      isPrimaryDisability,
      isLastDisability,
      Role,
      BannerTypes,
      selectedDisabilityCategory,
      disabilityCategoryLabel,
      selectedDisabilityType,
      disabilityTypeLabel,
      disabilityNotes,
      diagnosisText,
      diagnosisNotes,
      selectedImpairments,
      impairmentsNotes,
      additionalNotes,
      disabilityCategoryLookup,
      disabilityTypeLookup,
      impairmentLookup,
      checkNullOrEmptyRule,
      checkLengthRule,
    };
  },
});
</script>
