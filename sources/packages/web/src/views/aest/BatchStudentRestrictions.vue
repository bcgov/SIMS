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
        <v-form ref="batchStudentRestrictionsForm">
          <v-select
            v-model="restrictionId"
            :items="restrictions"
            item-title="description"
            item-value="id"
            :rules="[(v) => !!v || 'Restriction is required.']"
            label="Restriction"
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
            :disable-primary-button="
              !restrictionId || !applicationNumbers?.trim()
            "
            :show-secondary-button="false"
          />
        </v-form>
      </content-group>
    </body-header-container>

    <user-note-confirm-modal
      title="Batch restrictions"
      ref="confirmBatchStudentRestrictionsModal"
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

    <batch-student-restrictions-history ref="batchStudentRestrictionsHistory" />
  </full-page-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ApiProcessError, LayoutTemplates, RestrictionType } from "@/types";
import type { VForm } from "@/types";
import BatchStudentRestrictionsHistory from "@/components/aest/BatchStudentRestrictionsHistory.vue";
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
import { RestrictionAPIOutDTO } from "@/services/http/dto";

const MAX_APPLICATION_NUMBERS = 50000;

const snackBar = useSnackBar();
const { checkApplicationNumbersRule } = useRules();
const { parseApplicationNumbers } = useFormatters();

const restrictions = ref<RestrictionAPIOutDTO[]>([]);
const restrictionId = ref<number | null>(null);
const applicationNumbers = ref("");
const batchStudentRestrictionsHistory = ref(
  {} as InstanceType<typeof BatchStudentRestrictionsHistory>,
);
const batchStudentRestrictionsForm = ref({} as VForm);
const confirmBatchStudentRestrictionsModal = ref(
  {} as ModalDialog<UserNoteModal<string>>,
);

const loadRestrictions = async () => {
  try {
    restrictions.value = await RestrictionService.shared.getRestrictionReasons(
      RestrictionType.Provincial,
    );
  } catch {
    snackBar.error("Unexpected error while loading the restrictions.");
  }
};

watchEffect(loadRestrictions);

const openConfirmSubmitModal = async () => {
  const { valid } = await batchStudentRestrictionsForm.value.validate();
  if (!valid) {
    return;
  }

  const selectedRestriction = restrictions.value.find(
    (restriction) => restriction.id === restrictionId.value,
  );
  await confirmBatchStudentRestrictionsModal.value.showModal(
    selectedRestriction?.description,
    submitRestriction,
  );
};

const submitRestriction = async (
  userNoteModalResult: UserNoteModal<string>,
): Promise<boolean> => {
  try {
    await RestrictionService.shared.createBatchStudentRestrictions({
      restrictionId: restrictionId.value as number,
      applicationNumbers: parseApplicationNumbers(applicationNumbers.value),
      note: userNoteModalResult.note,
    });
    snackBar.success("Batch restriction submitted successfully.");
    batchStudentRestrictionsForm.value.reset();
    await batchStudentRestrictionsHistory.value.reload();
    return true;
  } catch (error) {
    if (error instanceof ApiProcessError) {
      snackBar.error(error.message);
      return false;
    }
    snackBar.error(
      "Unexpected error while submitting batch student restrictions.",
    );
    return false;
  }
};
</script>
