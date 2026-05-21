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
                disabilityPriority === 1
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
              v-if="disabilityPriority !== 1"
              >Up</v-btn
            >
            <v-btn
              prepend-icon="mdi-arrow-down"
              @click.stop="$emit('moveDown')"
              v-if="disabilityPriority !== maxDisabilityPriority"
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
                :items="disabilityCategoryOptions"
                label="Disability category"
                item-title="text"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-select
                :readonly="readOnly"
                v-model="selectedDisabilityType"
                :items="disabilityTypeOptions"
                label="Disability type"
                item-title="text"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
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
              v-for="option in IMPAIRMENTS"
              :key="option"
              cols="12"
              sm="6"
              class="py-0"
            >
              <v-checkbox
                :readonly="readOnly"
                color="primary"
                v-model="selected"
                :label="option"
                :value="option"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12"
              ><v-textarea
                :readonly="readOnly"
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
import { ref, defineComponent, watch, computed } from "vue";
import { useFormatters } from "@/composables";
import { AddressAPIOutDTO } from "@/services/http/dto";
import { Role, BannerTypes } from "@/types";

const IMPAIRMENTS = [
  "Ascend/Descend stairs",
  "Following instructions",
  "Completing tasks on time",
  "Lifting/Carrying/Holding/Reaching",
  "Sitting",
  "Taking notes in class",
  "Handwriting",
  "Other",
  "Speaking/Communicating",
  "Using Stairs",
  "Attending classes",
  "Hearing",
  "Reading",
  "Standing",
  "Vision",
  "Focus and concentration",
  "Keyboarding/Typing",
  "Remembering information",
  "Staying on task",
  "Walking",
];

const DISABILITY_CATEGORY_OPTIONS = [
  "Acquired brain injury",
  "ADHD",
  "Autism spectrum disorder",
  "Blind or low vision",
  "Deaf or hard of hearing",
  "Learning disability",
  "Mental health impairment",
  "Mobility impairment",
  "Other",
  "Pervasive development disorder",
  "Speech impairment",
].map((option) => ({ text: option, value: option }));

const DISABILITY_TYPE_OPTIONS = ["Permanent", "Persistent or prolonged"].map(
  (option) => ({ text: option, value: option }),
);

type DisabilityDetail = {
  id: number;
  disabilityCategory: string;
  disabilityType: string;
};

type DiagnosisDetail = {
  id: number;
  information: string;
};

const DISABILITY_DETAIL_HEADERS = [
  { title: "Disability category", key: "disabilityCategory" },
  { title: "Disability type", key: "disabilityType" },
  { title: "Actions", key: "actions", sortable: false, width: 120 },
];

const DIAGNOSIS_DETAIL_HEADERS = [
  { title: "Diagnosis information", key: "information" },
  { title: "Actions", key: "actions", sortable: false, width: 120 },
];

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    disabilityPriority: {
      type: Number,
      required: true,
    },
    maxDisabilityPriority: {
      type: Number,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: [
    "secondaryDisabilityChanged",
    "moveUp",
    "moveDown",
    "deleteDisability",
  ],
  setup(props, { emit }) {
    const address = ref({} as AddressAPIOutDTO);
    const selected = ref<string[]>([]);
    const selectedDisabilityCategory = ref("");
    const selectedDisabilityType = ref("");
    const disabilityDetails = ref<DisabilityDetail[]>([]);
    let nextDisabilityDetailId = 1;
    const hasSecondaryDisability = ref(false);

    const isPrimary = computed(() => props.disabilityPriority === 1);

    const addDisabilityDetail = () => {
      if (!selectedDisabilityCategory.value || !selectedDisabilityType.value) {
        return;
      }

      disabilityDetails.value.push({
        id: nextDisabilityDetailId,
        disabilityCategory: selectedDisabilityCategory.value,
        disabilityType: selectedDisabilityType.value,
      });
      nextDisabilityDetailId += 1;
      selectedDisabilityCategory.value = "";
      selectedDisabilityType.value = "";
    };

    const removeDisabilityDetail = (id: number) => {
      disabilityDetails.value = disabilityDetails.value.filter(
        (detail) => detail.id !== id,
      );
    };

    const diagnosisText = ref("");
    const diagnosisDetails = ref<DiagnosisDetail[]>([]);
    let nextDiagnosisDetailId = 1;

    const addDiagnosisDetail = () => {
      if (!diagnosisText.value.trim()) {
        return;
      }

      diagnosisDetails.value.push({
        id: nextDiagnosisDetailId,
        information: diagnosisText.value,
      });
      nextDiagnosisDetailId += 1;
      diagnosisText.value = "";
    };

    const removeDiagnosisDetail = (id: number) => {
      diagnosisDetails.value = diagnosisDetails.value.filter(
        (detail) => detail.id !== id,
      );
    };

    const {
      genderDisplayFormat,
      sinDisplayFormat,
      emptyStringFiller,
      dateOnlyLongString,
    } = useFormatters();

    watch(hasSecondaryDisability, (value) => {
      emit("secondaryDisabilityChanged", value);
    });

    return {
      isPrimary,
      address,
      sinDisplayFormat,
      genderDisplayFormat,
      dateOnlyLongString,
      emptyStringFiller,
      Role,
      BannerTypes,
      IMPAIRMENTS,
      selected,
      disabilityCategoryOptions: DISABILITY_CATEGORY_OPTIONS,
      disabilityTypeOptions: DISABILITY_TYPE_OPTIONS,
      selectedDisabilityCategory,
      selectedDisabilityType,
      disabilityDetailHeaders: DISABILITY_DETAIL_HEADERS,
      disabilityDetails,
      addDisabilityDetail,
      removeDisabilityDetail,
      diagnosisDetailHeaders: DIAGNOSIS_DETAIL_HEADERS,
      diagnosisText,
      diagnosisDetails,
      addDiagnosisDetail,
      removeDiagnosisDetail,
      hasSecondaryDisability,
    };
  },
});
</script>
