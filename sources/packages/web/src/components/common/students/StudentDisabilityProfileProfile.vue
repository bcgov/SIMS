<template>
  <h3 class="category-header-medium">Impairments</h3>
  <content-group>
    <v-row>
      <v-col
        v-for="option in IMPAIRMENTS"
        :key="option"
        cols="12"
        sm="6"
        class="py-0"
      >
        <v-checkbox
          color="primary"
          v-model="selected"
          :label="option"
          :value="option"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>
  </content-group>
  <h3 class="category-header-medium mt-4">Diagnosis information</h3>
  <content-group>
    <v-row class="mb-2 align-end justify-end">
      <v-col cols="12">
        <v-textarea
          v-model="diagnosisText"
          label="Diagnosis information"
          placeholder="Enter diagnosis details..."
          density="compact"
          variant="outlined"
          hide-details
          rows="3"
        />
      </v-col>
      <v-col cols="auto" class="d-flex justify-end align-end pt-0">
        <v-btn
          color="primary"
          block
          :disabled="!diagnosisText.trim()"
          @click="addDiagnosisDetail"
        >
          Add diagnosis
        </v-btn>
      </v-col>
    </v-row>
    <toggle-content
      :toggled="!diagnosisDetails.length"
      message="No diagnosis information added."
    >
      <div v-for="item in diagnosisDetails" :key="item.id" class="mb-4">
        <v-card border="1" elevation="0">
          <v-card-title class="secondary-color-light category-header-medium">
            Diagnosis information, created on May 5, 2026
          </v-card-title>
          <v-card-text>
            <div style="white-space: pre-wrap">
              {{ item.information }}
            </div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              color="primary"
              class="text-no-wrap"
              @click="removeDiagnosisDetail(item.id)"
            >
              Remove
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </toggle-content>
  </content-group>
  <h3 class="category-header-medium mt-4">Disability details</h3>
  <content-group>
    <v-row class="mb-2">
      <v-col cols="12" md="5">
        <v-select
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
      <v-col cols="12" md="5">
        <v-select
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
      <v-col cols="12" md="2" class="d-flex align-center">
        <v-btn
          color="primary"
          block
          :disabled="!selectedDisabilityCategory || !selectedDisabilityType"
          @click="addDisabilityDetail"
        >
          Add
        </v-btn>
      </v-col>
    </v-row>
    <toggle-content
      :toggled="!disabilityDetails.length"
      message="No disability details added."
    >
      <v-data-table
        :headers="disabilityDetailHeaders"
        :items="disabilityDetails"
        item-value="id"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #[`item.actions`]="{ item }">
          <v-btn
            color="primary"
            class="text-no-wrap"
            @click="removeDisabilityDetail(item.id)"
          >
            Remove
          </v-btn>
        </template>
      </v-data-table>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
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
  },
  setup() {
    const address = ref({} as AddressAPIOutDTO);
    const selected = ref<string[]>([]);
    const selectedDisabilityCategory = ref("");
    const selectedDisabilityType = ref("");
    const disabilityDetails = ref<DisabilityDetail[]>([]);
    let nextDisabilityDetailId = 1;

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

    return {
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
    };
  },
});
</script>
