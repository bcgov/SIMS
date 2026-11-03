<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator title="Ministry" sub-title="Batch Restrictions" />
    </template>
    <body-header-container :enable-card-view="true">
      <template #header>
        <body-header
          title="Batch restrictions"
          sub-title="Select the restriction and enter the application numbers for the students that require the restriction."
        />
      </template>
      <content-group>
        <v-form ref="batchRestrictionForm">
          <v-select
            v-model="selectedCategory"
            :items="restrictionCategories"
            @update:model-value="loadRestrictionReasons"
            :rules="[(v) => !!v || 'Category is required.']"
            label="Category"
            density="compact"
            variant="outlined"
            class="mb-4"
            hide-details="auto"
          />
          <v-select
            v-model="restrictionId"
            :items="restrictionReasons"
            item-title="description"
            item-value="id"
            :rules="[(v) => !!v || 'Reason is required.']"
            label="Reason"
            density="compact"
            variant="outlined"
            class="mb-4"
            hide-details="auto"
          />
          <v-textarea
            v-model="applicationNumbers"
            :rules="[
              (v) => checkApplicationNumbersRule(v, MAX_APPLICATION_NUMBERS),
            ]"
            label="Enter applications here"
            variant="outlined"
            max-rows="20"
            auto-grow
            hide-details="auto"
          />
          <footer-buttons
            primary-label="Submit"
            justify="end"
            @primary-click="openConfirmSubmitModal"
            :show-secondary-button="false"
          />
        </v-form>
      </content-group>
    </body-header-container>

    <user-note-confirm-modal
      title="Batch restrictions"
      ref="confirmBatchRestrictionModal"
      ok-label="Submit"
    >
      <template #content="{ showParameter }">
        <p>
          Are you sure you want to add the selected restriction to all entered
          students?
        </p>
        <p><strong>Restriction:</strong> {{ showParameter }}</p>
      </template>
    </user-note-confirm-modal>

    <batch-restriction-history ref="batchRestrictionHistory" />
  </full-page-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ApiProcessError, LayoutTemplates, RestrictionType } from "@/types";
import type { ComponentItemType, VForm } from "@/types";
import BatchRestrictionHistory from "@/components/aest/BatchRestrictionHistory.vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import {
  ModalDialog,
  useFormatters,
  useRules,
  useSnackBar,
} from "@/composables";
import { RestrictionService } from "@/services/RestrictionService";
import { BatchRestrictionService } from "@/services/BatchRestrictionService";
import { RestrictionAPIOutDTO } from "@/services/http/dto";

const MAX_APPLICATION_NUMBERS = 20000;

const snackBar = useSnackBar();
const { checkApplicationNumbersRule } = useRules();
const { parseApplicationNumbers } = useFormatters();

const restrictionCategories = ref<ComponentItemType[]>([]);
const restrictionReasons = ref<RestrictionAPIOutDTO[]>([]);
const selectedCategory = ref<string | null>(null);
const restrictionId = ref<number | null>(null);
const applicationNumbers = ref("");
const batchRestrictionHistory = ref(
  {} as InstanceType<typeof BatchRestrictionHistory>,
);
const batchRestrictionForm = ref({} as VForm);
const confirmBatchRestrictionModal = ref(
  {} as ModalDialog<UserNoteModal<string>>,
);

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

watchEffect(loadRestrictionCategories);

/**
 * Loads the provincial restriction reasons for the selected category.
 * The previously selected reason is cleared since it may not belong to the new category.
 */
const loadRestrictionReasons = async () => {
  restrictionId.value = null;
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

const openConfirmSubmitModal = async () => {
  const { valid } = await batchRestrictionForm.value.validate();
  if (!valid) {
    return;
  }

  const selectedRestriction = restrictionReasons.value.find(
    (restriction) => restriction.id === restrictionId.value,
  );
  await confirmBatchRestrictionModal.value.showModal(
    selectedRestriction?.description,
    submitRestriction,
  );
};

const submitRestriction = async (
  userNoteModalResult: UserNoteModal<string>,
): Promise<boolean> => {
  try {
    await BatchRestrictionService.shared.createBatchRestriction({
      restrictionId: restrictionId.value as number,
      applicationNumbers: parseApplicationNumbers(applicationNumbers.value),
      note: userNoteModalResult.note,
    });
    snackBar.success("Batch restriction submitted successfully.");
    batchRestrictionForm.value.reset();
    await batchRestrictionHistory.value.reload();
    return true;
  } catch (error) {
    if (error instanceof ApiProcessError) {
      snackBar.error(error.message);
      return false;
    }
    snackBar.error("Unexpected error while submitting the batch restriction.");
    return false;
  }
};
</script>
