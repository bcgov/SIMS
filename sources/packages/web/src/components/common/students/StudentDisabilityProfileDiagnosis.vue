<template>
  <v-row dense v-if="!readOnly">
    <v-col>
      <v-text-field
        v-if="!readOnly"
        v-model.trim="diagnosisEntryInput"
        :readonly="readOnly"
        label="Diagnosis information"
        placeholder="Enter diagnosis and click Add or press Enter"
        :persistent-placeholder="true"
        density="compact"
        variant="outlined"
        hide-details="auto"
        :rules="[
          (v) =>
            checkLengthRule(
              v,
              DIAGNOSIS_ENTRY_MAX_LENGTH,
              'Diagnosis information',
              false,
            ),
        ]"
        @keydown.enter.prevent="addDiagnosisEntry"
      />
    </v-col>
    <v-col cols="auto">
      <v-btn
        v-if="!readOnly"
        prepend-icon="fas fa-plus"
        color="primary"
        variant="outlined"
        @click="addDiagnosisEntry"
      >
        Add diagnosis
      </v-btn>
    </v-col>
  </v-row>
  <v-table striped="even" :class="readOnly ? 'mt-n4' : 'mt-2'">
    <thead>
      <tr>
        <th id="diagnosis-entries" class="text-left">
          <v-icon icon="mdi-stethoscope" class="mr-1" size="18" />
          Diagnosis entries
        </th>
        <th id="actions" v-if="!readOnly" class="text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr headers="diagnosis-entries" v-if="!diagnosisItems.length">
        <td :colspan="readOnly ? 1 : 2" class="text-medium-emphasis">
          No diagnosis entries added.
        </td>
      </tr>
      <tr
        v-for="(diagnosisItem, index) in diagnosisItems"
        :key="`${diagnosisItem}-${index}`"
      >
        <td headers="diagnosis-entries">{{ diagnosisItem }}</td>
        <td headers="actions" v-if="!readOnly" class="text-right pa-0">
          <v-btn
            color="error"
            variant="plain"
            size="large"
            @click="removeDiagnosisEntry(index)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>
  <v-input
    :model-value="diagnosisItems"
    :rules="[validateDiagnosisItems]"
    hide-details="auto"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRules } from "@/composables";

const DIAGNOSIS_ENTRY_MAX_LENGTH = 250;

interface Props {
  modelValue: string[];
  readOnly: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const { checkLengthRule } = useRules();
const diagnosisEntryInput = ref("");

/**
 * Local reactive copies initialized from the model prop.
 */
const diagnosisItems = ref<string[]>([...props.modelValue]);

/**
 * Adds a diagnosis entry to the list after validation.
 */
const addDiagnosisEntry = (): void => {
  if (!diagnosisEntryInput.value) {
    return;
  }
  diagnosisItems.value.push(diagnosisEntryInput.value);
  diagnosisEntryInput.value = "";
};

/**
 * Removes one diagnosis entry by index.
 * @param index Index of the entry to remove.
 */
const removeDiagnosisEntry = (index: number): void => {
  diagnosisItems.value.splice(index, 1);
};

/**
 * Validates diagnosis entries ensuring each item stays within the allowed max length.
 * @param diagnosisItems List of diagnosis entries from the combobox.
 * @returns True when all entries are valid, otherwise an error message.
 */
const validateDiagnosisItems = (diagnosisItems: string[]): true | string => {
  if (diagnosisItems?.length === 0) {
    return "At least one diagnosis entry is required.";
  }
  return true;
};

/**
 * Emit the updated model to the parent whenever any entry is added/removed.
 */
watch(
  [diagnosisItems],
  () => {
    emit("update:modelValue", diagnosisItems.value ?? props.modelValue);
  },
  { deep: true },
);
</script>
