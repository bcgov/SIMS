<template>
  <v-skeleton-loader :loading="loading" type="list-item-three-line@3">
    <v-expansion-panels class="mt-5" multiple v-model="expandedPanels">
      <student-disability-profile-disability
        v-for="(disability, index) in disabilities"
        :key="disability.uniqueKey"
        :ref="
          (component) =>
            setDisabilityComponentRef(component, disability.uniqueKey)
        "
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
  </v-skeleton-loader>
</template>

<script setup lang="ts">
import { onBeforeUpdate, ref, watchEffect, nextTick } from "vue";
import type { StudentDisability } from "@/types";
import { DisabilityProfileService } from "@/services/DisabilityProfileService";
import StudentDisabilityProfileDisability from "@/components/common/students/StudentDisabilityProfileDisability.vue";

type DisabilityPanelComponent = {
  validatePanel: () => Promise<boolean>;
  clearValidation: () => void;
};

interface Props {
  studentId: number;
  disabilityProfileId?: number;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabilityProfileId: undefined,
  readOnly: false,
});

const expandedPanels = ref<number[]>([]);

/**
 * Used as a stable Vue component key, independent of the server-assigned id.
 * Allow swapping and deleting disabilities without losing component state or causing rendering issues,
 * even for disabilities that haven't been saved to the server yet (and thus don't have an id).
 */
let nextUniqueKey = 1;

const createEmptyDisability = (
  disabilityPriority: number = 1,
): StudentDisability => ({
  uniqueKey: nextUniqueKey++,
  id: undefined,
  disabilityPriority,
  disabilityCategory: "",
  disabilityType: "",
  diagnosis: [],
  diagnosisNotes: undefined,
  impairments: [],
  disabilityNotes: undefined,
  impairmentsNotes: undefined,
  finalNotes: undefined,
});

const disabilities = ref<StudentDisability[]>([]);

const disabilityComponentRefs = ref(
  new Map<number, DisabilityPanelComponent>(),
);
const loading = ref(false);
const uniqueKeysByDisabilityId = new Map<number, number>();

/**
 * Returns a stable local key for a persisted disability id.
 * The same disability id always gets the same key to avoid unnecessary remounts.
 * @param disabilityId persisted disability id.
 * @returns Stable local key used by Vue v-for.
 */
const getStableUniqueKey = (disabilityId: number): number => {
  const existingKey = uniqueKeysByDisabilityId.get(disabilityId);
  if (existingKey) {
    return existingKey;
  }
  const newKey = nextUniqueKey++;

  uniqueKeysByDisabilityId.set(disabilityId, newKey);
  return newKey;
};

/**
 * Keeps the disability component refs map in sync with the disabilities
 * list by clearing all refs before each component update.
 */
onBeforeUpdate(() => {
  disabilityComponentRefs.value.clear();
});

/**
 * Captures the disability component instance for later bulk validation.
 * @param component disability component instance.
 * @param uniqueKey stable disability key.
 */
const setDisabilityComponentRef = (
  component: unknown,
  uniqueKey: number,
): void => {
  if (!component) {
    return;
  }
  disabilityComponentRefs.value.set(
    uniqueKey,
    component as DisabilityPanelComponent,
  );
};

/**
 * If a single disability is present, which is common for most student disability profiles,
 * expand the panel by default to show all details without requiring an extra click.
 */
const expandPanelIfOnlyOne = (): void => {
  if (!props.readOnly || disabilities.value.length !== 1) {
    return;
  }
  expandedPanels.value = [0];
};

/**
 * Create a new disability with default values and add it to the list.
 */
const addDisability = (): void => {
  disabilities.value.push(createEmptyDisability(disabilities.value.length + 1));
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
    disabilities.value = [createEmptyDisability()];
    return;
  }
  if (!props.disabilityProfileId) {
    return;
  }
  loading.value = true;
  const disabilityProfile =
    await DisabilityProfileService.shared.getStudentDisabilityProfile(
      props.studentId,
      props.disabilityProfileId,
    );
  disabilities.value = disabilityProfile.disabilities.map((disability) => ({
    uniqueKey: getStableUniqueKey(disability.id),
    id: disability.id,
    disabilityPriority: disability.disabilityPriority,
    disabilityCategory: disability.disabilityCategory,
    disabilityType: disability.disabilityType,
    diagnosis: disability.diagnosis,
    diagnosisNotes: disability.diagnosisNotes,
    impairments: disability.impairments,
    disabilityNotes: disability.disabilityNotes,
    impairmentsNotes: disability.impairmentsNotes,
    finalNotes: disability.finalNotes,
  }));
  loading.value = false;
  expandPanelIfOnlyOne();
};

watchEffect(async () => {
  await loadDisabilities();
});

/**
 * Validates every disability panel form and updates panel highlight colors.
 * @returns True when all disability forms are valid.
 */
const validateDisabilityForms = async (): Promise<boolean> => {
  // Ensure refs are set after any DOM update before validating.
  await nextTick();
  let isValid = true;
  for (const disability of disabilities.value) {
    const component = disabilityComponentRefs.value.get(disability.uniqueKey);
    if (!component) {
      continue;
    }
    const isComponentValid = await component.validatePanel();
    if (isComponentValid) {
      component.clearValidation();
      continue;
    }
    if (isValid) {
      isValid = false;
    }
  }
  return isValid;
};

const getDisabilities = (): StudentDisability[] => {
  return [...disabilities.value];
};

defineExpose({
  reloadData: loadDisabilities,
  validateDisabilityForms,
  getDisabilities,
});
</script>
