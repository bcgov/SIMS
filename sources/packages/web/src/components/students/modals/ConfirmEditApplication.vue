<template>
  <modal-dialog-base title="Edit application" :show-dialog="showDialog">
    <template #content>
      <p>
        Any edits made to your application may require the resubmission of
        supporting information, potentially delaying your application. Edits and
        re-submission of your application will result in a revised submission
        date, which may trigger an exception and/or require a Funding After End
        Date appeal.
      </p>
      <p v-if="showPartnerNote">
        Note: If you only need to update your spouse/common-law partner
        information, submit an application edit without making any other
        changes. This will create a new supporting user submission form so the
        updated information can be provided.
      </p>
      <p v-if="showParentNote">
        Note: If you only need to update your parent information, submit an
        application edit without making any other changes. This will create a
        new supporting user submission form so the updated information can be
        provided.
      </p>
    </template>
    <template #footer>
      <footer-buttons
        primary-label="Edit application"
        secondary-label="No"
        @primary-click="editApplication"
        @secondary-click="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script setup lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationDataAPIOutDTO } from "@/services/http/dto";
import {
  DependantStatus,
  OfferingIntensity,
  RelationshipStatus,
} from "@/types";
import { computed, ref } from "vue";

const {
  showDialog,
  resolvePromise,
  showModal: showModalInternal,
} = useModalDialog<boolean>();

const applicationData = ref<ApplicationDataAPIOutDTO>();

const showModal = async (applicationId: number) => {
  applicationData.value =
    await ApplicationService.shared.getApplicationData(applicationId);
  return showModalInternal();
};

const dialogClosed = () => {
  resolvePromise(false);
};

const editApplication = () => {
  resolvePromise(true);
};

const showParentNote = computed(() => {
  // TODO Is the full time check necessary?
  return (
    applicationData.value?.applicationOfferingIntensity ===
      OfferingIntensity.fullTime &&
    applicationData.value?.data?.dependantStatus === DependantStatus.Dependant
  );
});

const showPartnerNote = computed(() => {
  return (
    applicationData.value?.data?.relationshipStatus ===
    RelationshipStatus.Married
  );
});

defineExpose({ showModal });
</script>
