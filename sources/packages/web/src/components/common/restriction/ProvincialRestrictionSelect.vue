<template>
  <v-select
    v-model="selectedCategory"
    :items="restrictionCategories"
    @update:model-value="loadRestrictionReasons"
    :rules="[(v) => !!v || 'Category is required.']"
    label="Category"
    density="compact"
    variant="outlined"
    class="mb-2"
    hide-details="auto"
  />
  <v-select
    v-model="restriction"
    :items="restrictionReasons"
    item-title="description"
    item-value="id"
    return-object
    :rules="[(v) => !!v || 'Reason is required.']"
    label="Reason"
    density="compact"
    variant="outlined"
    class="mb-2"
    hide-details="auto"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { RestrictionType } from "@/types";
import type { ComponentItemType } from "@/types";
import { useSnackBar } from "@/composables";
import { RestrictionService } from "@/services/RestrictionService";
import { RestrictionAPIOutDTO } from "@/services/http/dto";

// Provincial restriction selected as the reason of the selected category.
const restriction = defineModel<RestrictionAPIOutDTO | null>({
  default: null,
});

const snackBar = useSnackBar();

const restrictionCategories = ref<ComponentItemType[]>([]);
const restrictionReasons = ref<RestrictionAPIOutDTO[]>([]);
const selectedCategory = ref<string | null>(null);

const loadRestrictionCategories = async () => {
  try {
    const categories =
      await RestrictionService.shared.getRestrictionCategories();
    restrictionCategories.value = categories.map((category) => ({
      title: category.description,
      value: category.description,
    }));
  } catch {
    snackBar.error(
      "Unexpected error while loading the restriction categories.",
    );
  }
};

/**
 * Loads the provincial restriction reasons for the selected category.
 * The previously selected reason is cleared since it may not belong to the new category.
 */
const loadRestrictionReasons = async () => {
  restriction.value = null;
  restrictionReasons.value = [];
  const requestedCategory = selectedCategory.value;
  if (!requestedCategory) {
    return;
  }
  try {
    const reasons = await RestrictionService.shared.getRestrictionReasons(
      RestrictionType.Provincial,
      requestedCategory,
    );
    // Ignore responses for a category that is no longer selected.
    if (requestedCategory === selectedCategory.value) {
      restrictionReasons.value = reasons;
    }
  } catch {
    snackBar.error("Unexpected error while loading the restriction reasons.");
  }
};

watchEffect(loadRestrictionCategories);
</script>
