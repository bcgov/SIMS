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
          <provincial-restriction-select v-model="restriction" />
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
import { ref } from "vue";
import { ApiProcessError, LayoutTemplates } from "@/types";
import type { VForm } from "@/types";
import BatchRestrictionHistory from "@/components/aest/BatchRestrictionHistory.vue";
import ProvincialRestrictionSelect from "@/components/common/restriction/ProvincialRestrictionSelect.vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import {
  ModalDialog,
  useFormatters,
  useRules,
  useSnackBar,
} from "@/composables";
import { BatchRestrictionService } from "@/services/BatchRestrictionService";
import { RestrictionAPIOutDTO } from "@/services/http/dto";

const MAX_APPLICATION_NUMBERS = 20000;

const snackBar = useSnackBar();
const { checkApplicationNumbersRule } = useRules();
const { parseApplicationNumbers } = useFormatters();

const restriction = ref<RestrictionAPIOutDTO | null>(null);
const applicationNumbers = ref("");
const batchRestrictionHistory = ref(
  {} as InstanceType<typeof BatchRestrictionHistory>,
);
const batchRestrictionForm = ref({} as VForm);
const confirmBatchRestrictionModal = ref(
  {} as ModalDialog<UserNoteModal<string>>,
);

const openConfirmSubmitModal = async () => {
  const { valid } = await batchRestrictionForm.value.validate();
  if (!valid) {
    return;
  }

  await confirmBatchRestrictionModal.value.showModal(
    restriction.value?.description,
    submitRestriction,
  );
};

const submitRestriction = async (
  userNoteModalResult: UserNoteModal<string>,
): Promise<boolean> => {
  try {
    await BatchRestrictionService.shared.createBatchRestriction({
      restrictionId: restriction.value?.id as number,
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
