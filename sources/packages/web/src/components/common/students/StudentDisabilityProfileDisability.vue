<template>
  <v-expansion-panels class="mt-5">
    <v-expansion-panel>
      <template #title>
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <span class="category-header-medium brand-gray-text">
              {{ selectedDisabilityCategory || "Select disability category" }}
            </span>
            <div>
              {{
                isPrimaryDisability
                  ? "Primary disability"
                  : "Additional disability"
              }}
              ({{ selectedDisabilityType || "Select disability type" }})
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
                hide-details
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
                hide-details
              />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="disabilityNotes"
                label="Disability details notes"
                variant="outlined"
                rows="3"
                hide-details
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
                hide-details
            /></v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="diagnosisNotes"
                label="Diagnosis notes"
                variant="outlined"
                rows="3"
                hide-details
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
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
                v-model="impairmentsNotes"
                label="Impairments notes"
                variant="outlined"
                rows="3"
                hide-details
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
            /></v-col>
          </v-row>
        </content-group>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { ref, defineComponent, computed, watchEffect, watch } from "vue";
import { useSnackBar } from "@/composables";
import { SystemLookupEntryAPIOutDTO } from "@/services/http/dto";
import { BannerTypes, Role, SystemLookupCategory } from "@/types";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";

type DisabilityModel = {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  disabilityNotes?: string;
  diagnosis: string;
  diagnosisNotes?: string;
  impairments: string[];
  impairmentsNotes?: string;
  additionalNotes?: string;
};

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
    disabilityModel: {
      type: Object as () => DisabilityModel,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ["update:disabilityModel", "moveUp", "moveDown", "deleteDisability"],
  setup(props, { emit }) {
    const snackBar = useSnackBar();

    const isLookupLoaded = ref(false);
    const disabilityCategoryLookup = ref<SystemLookupEntryAPIOutDTO[]>();
    const disabilityTypeLookup = ref<SystemLookupEntryAPIOutDTO[]>();
    const impairmentLookup = ref<SystemLookupEntryAPIOutDTO[]>();

    // Local reactive copies initialized from the model prop.
    const selectedDisabilityCategory = ref(
      props.disabilityModel.disabilityCategory,
    );
    const selectedDisabilityType = ref(props.disabilityModel.disabilityType);
    const disabilityNotes = ref(props.disabilityModel.disabilityNotes ?? "");
    const diagnosisText = ref(props.disabilityModel.diagnosis);
    const diagnosisNotes = ref(props.disabilityModel.diagnosisNotes ?? "");
    const selectedImpairments = ref<string[]>([
      ...props.disabilityModel.impairments,
    ]);
    const impairmentsNotes = ref(props.disabilityModel.impairmentsNotes ?? "");
    const additionalNotes = ref(props.disabilityModel.additionalNotes ?? "");

    const isPrimaryDisability = computed(
      () => props.disabilityModel.disabilityPriority === 1,
    );

    const isLastDisability = computed(
      () =>
        props.disabilityModel.disabilityPriority ===
        props.maxDisabilityPriority,
    );

    // Emit the full updated model to the parent whenever any field changes.
    const emitUpdate = () => {
      emit("update:disabilityModel", {
        ...props.disabilityModel,
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
      selectedDisabilityType,
      disabilityNotes,
      diagnosisText,
      diagnosisNotes,
      selectedImpairments,
      impairmentsNotes,
      additionalNotes,
      disabilityCategoryLookup,
      disabilityTypeLookup,
      impairmentLookup,
    };
  },
});
</script>
