<template>
  <v-expansion-panels class="mt-5" multiple>
    <student-disability-profile-disability
      v-for="(disability, index) in disabilities"
      :key="disability.uniqueKey"
      :ref="(component) => setPanelComponentRef(component, index)"
      :student-id="studentId"
      v-model="disabilities[index]"
      :max-disability-priority="disabilities.length"
      :read-only="readOnly"
      @move-up="moveDisability(index, 'up')"
      @move-down="moveDisability(index, 'down')"
      @delete-disability="deleteDisability(index)"
    />
  </v-expansion-panels>
  <v-row class="mt-2" v-if="!readOnly" justify="end">
    <v-col cols="auto">
      <v-btn
        prepend-icon="fas fa-plus"
        color="primary"
        variant="outlined"
        @click="addDisability"
        >Add new disability</v-btn
      >
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onBeforeUpdate, ref, watch, watchEffect } from "vue";
import type { StudentDisability } from "@/types";
import { DisabilityProfileService } from "@/services/DisabilityProfileService";
import StudentDisabilityProfileDisability from "@/components/common/students/StudentDisabilityProfileDisability.vue";

type DisabilityPanelComponent = {
  validatePanel: () => Promise<boolean>;
  clearValidationPanelHighlight: () => void;
};

interface Props {
  studentId: number;
  disabilityProfileId?: number;
  readOnly?: boolean;
  modelValue?: StudentDisability[];
}

const props = withDefaults(defineProps<Props>(), {
  disabilityProfileId: undefined,
  readOnly: false,
  modelValue: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: StudentDisability[]];
}>();

/**
 * Used as a stable Vue component key, independent of the server-assigned id.
 * Allow swapping and deleting disabilities without losing component state or causing rendering issues,
 * even for disabilities that haven't been saved to the server yet (and thus don't have an id).
 */
let nextUniqueKey = 1;
const disabilities = ref<StudentDisability[]>(props.modelValue || []);
const panelComponentRefs = ref<DisabilityPanelComponent[]>([]);

onBeforeUpdate(() => {
  panelComponentRefs.value = [];
});

/**
 * Captures a panel component instance for later bulk validation.
 * @param component panel component instance.
 * @param index index in the disabilities array.
 */
const setPanelComponentRef = (component: unknown, index: number): void => {
  if (!component) {
    return;
  }
  panelComponentRefs.value[index] = component as DisabilityPanelComponent;
};

// Notify the parent whenever the disabilities list or any of its items change,
// allowing the parent to collect the current state for submission via v-model.
watch(disabilities, (value) => emit("update:modelValue", value), {
  deep: true,
});

// Allow the consumer to push changes into this component (e.g. adding a new item)
// by watching the modelValue prop and syncing it back into the internal ref.
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      disabilities.value = value;
    }
  },
  { deep: true },
);

/**
 * Create a new disability with default values and add it to the list.
 */
const addDisability = (): void => {
  const newDisability: StudentDisability = {
    uniqueKey: disabilities.value.length + 1,
    id: undefined,
    disabilityPriority: disabilities.value.length + 1,
    disabilityCategory: "",
    disabilityType: "",
    diagnosis: "",
    impairments: [],
  };
  disabilities.value.push(newDisability);
};

/**
 * After moving a disability up or down, we need to normalize the priorities so that
 * they are in sequential order starting from 1. This ensures that the disability priorities
 * remain consistent and accurate after any reordering operations, allowing the components
 * to adjust their available actions (e.g., "move up", "move down") based on the updated priorities.
 */
const normalizePriorities = (): void => {
  disabilities.value.forEach((disability, index) => {
    disability.disabilityPriority = index + 1;
  });
};

/**
 * Swaps the disability at the given index with the one above it, then normalizes priorities.
 * @param index the index of the disability to move.
 * @param direction The direction to move the disability ("up" or "down").
 */
const moveDisability = (index: number, direction: "up" | "down"): void => {
  const items = disabilities.value;
  const targetIndex = index + (direction === "up" ? -1 : 1);
  [items[targetIndex], items[index]] = [items[index], items[targetIndex]];
  normalizePriorities();
};

/**
 * Removes a disability from the list based on its index, then normalizes priorities.
 * @param index the index of the disability to remove.
 */
const deleteDisability = (index: number): void => {
  disabilities.value.splice(index, 1);
  normalizePriorities();
};

const loadDisabilities = async (): Promise<void> => {
  if (!props.disabilityProfileId && !props.readOnly) {
    disabilities.value = [
      {
        uniqueKey: nextUniqueKey++,
        id: undefined,
        disabilityPriority: 1,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
    ];
    return;
  }
  if (!props.disabilityProfileId) {
    return;
  }
  const disabilityProfile =
    await DisabilityProfileService.shared.getStudentDisabilityProfile(
      props.studentId,
      props.disabilityProfileId,
    );
  disabilities.value = disabilityProfile.disabilities.map((disability) => ({
    uniqueKey: nextUniqueKey++,
    id: disability.id,
    disabilityPriority: disability.disabilityPriority,
    disabilityCategory: disability.disabilityCategory,
    disabilityType: disability.disabilityType,
    diagnosis: disability.diagnosis,
    diagnosisNotes: disability.diagnosisNotes,
    impairments: disability.impairments,
    disabilityNotes: disability.disabilityNotes,
    impairmentsNotes: disability.impairmentsNotes,
    additionalNotes: disability.additionalNotes,
  }));
};

watchEffect(async () => {
  await loadDisabilities();
});

/**
 * Validates every disability panel form and updates panel highlight colors.
 * @returns True when all panel forms are valid.
 */
const validatePanelForms = async (): Promise<boolean> => {
  const validationResults = await Promise.all(
    panelComponentRefs.value.map((panelComponent) =>
      panelComponent.validatePanel(),
    ),
  );
  const isValid = validationResults.every((result) => result);
  if (isValid) {
    panelComponentRefs.value.forEach((panelComponent) => {
      panelComponent.clearValidationPanelHighlight();
    });
  }
  return isValid;
};

defineExpose({
  reloadData: loadDisabilities,
  validatePanelForms,
});
</script>
