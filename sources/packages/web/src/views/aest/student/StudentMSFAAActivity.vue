<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Activity" :records-count="msfaaActivity?.length">
          <template #actions>
            <v-row density="compact" class="justify-end align-center">
              <v-col cols="12" sm="6" md="4" lg="3" class="pa-0">
                <v-select
                  v-model="selectedMSFAAId"
                  :items="reissueOptions"
                  label="MSFAA number"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  :disabled="!reissueOptions.length"
                />
              </v-col>
              <v-col cols="auto">
                <check-permission-role :role="Role.StudentReissueMSFAA">
                  <template #="{ notAllowed }">
                    <v-btn
                      color="primary"
                      :disabled="notAllowed || !selectedMSFAAId"
                      @click="reissueMSFAA"
                      >Issue MSFAA</v-btn
                    >
                  </template>
                </check-permission-role>
              </v-col>
            </v-row>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!msfaaActivity?.length && !isLoading"
          message="No MSFAA records found."
        >
          <v-data-table
            :headers="MSFAAActivityHeaders"
            :items="msfaaActivity"
            :loading="isLoading"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5" />
            </template>
            <template #[`item.createdAt`]="{ item }">
              {{ dateOnlyLongString(item.createdAt) }}
            </template>
            <template #[`item.offeringIntensity`]="{ item }">
              {{ mapOfferingIntensity(item.offeringIntensity) }}
            </template>
            <template #[`item.dateSent`]="{ item }">
              {{
                item.dateSent
                  ? dateOnlyLongString(item.dateSent)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.dateSigned`]="{ item }">
              {{
                item.dateSigned
                  ? dateOnlyLongString(item.dateSigned)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.cancelledDate`]="{ item }">
              {{
                item.cancelledDate
                  ? dateOnlyLongString(item.cancelledDate)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.newIssuingProvince`]="{ item }">
              {{ emptyStringFiller(item.newIssuingProvince) }}
            </template>
            <template #[`item.action`]="{ item }">
              <check-permission-role :role="Role.StudentCancelMSFAA">
                <template #="{ notAllowed }">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    :disabled="notAllowed || !!item.cancelledDate"
                    @click="cancelMSFAA(item)"
                    >Cancel</v-btn
                  >
                </template>
              </check-permission-role>
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </body-header-container>
    <user-note-confirm-modal
      ref="cancelMSFAAModal"
      title="Cancel MSFAA"
      ok-label="Confirm cancellation"
      cancel-label="Cancel"
      notes-label="Note"
    >
      <template #content>
        <p>
          Are you sure you want to cancel this MSFAA? You will not be able to
          reverse this cancellation once it has been confirmed.
        </p>
      </template>
    </user-note-confirm-modal>
    <user-note-confirm-modal
      ref="reissueMSFAAModal"
      title="Issue New MSFAA"
      ok-label="Issue MSFAA"
      cancel-label="Cancel"
      notes-label="Note"
    >
      <template #content="{ showParameter }">
        <detail-header
          class="mb-2"
          :header-map="{
            Intensity: mapOfferingIntensity(showParameter.offeringIntensity),
            MSFAA: showParameter.msfaaNumber,
          }"
        />
      </template>
    </user-note-confirm-modal>
  </tab-container>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import {
  ModalDialog,
  useFormatters,
  useOffering,
  useSnackBar,
} from "@/composables";
import { MSFAANumberService } from "@/services/MSFAANumberService";
import { MSFAANumberAPIOutDTO } from "@/services/http/dto";
import { MSFAAActivityHeaders } from "@/types/contracts/DataTableContract";
import { Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";

const props = defineProps({
  studentId: {
    type: Number,
    required: true,
  },
});

const { mapOfferingIntensity } = useOffering();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const isLoading = ref(true);
const msfaaActivity = ref<MSFAANumberAPIOutDTO[]>([]);
const selectedMSFAAId = ref<number>();
const cancelMSFAAModal = ref({} as ModalDialog<UserNoteModal<number>>);
const reissueMSFAAModal = ref(
  {} as ModalDialog<UserNoteModal<MSFAANumberAPIOutDTO>>,
);

// Only the cancelled MSFAAs that the API indicates as eligible can be reissued.
const reissueOptions = computed(() =>
  msfaaActivity.value
    .filter((msfaa) => msfaa.canBeReissued)
    .map((msfaa) => ({
      title: `${mapOfferingIntensity(msfaa.offeringIntensity)} - ${msfaa.msfaaNumber}`,
      value: msfaa.id,
    })),
);

const loadMSFAAActivity = async () => {
  try {
    isLoading.value = true;
    msfaaActivity.value =
      await MSFAANumberService.shared.getStudentMSFAAActivity(props.studentId);
    selectedMSFAAId.value = undefined;
  } catch {
    snackBar.error("An error occurred while loading MSFAA activity.");
  } finally {
    isLoading.value = false;
  }
};

const cancelMSFAA = async (msfaa: MSFAANumberAPIOutDTO) => {
  await cancelMSFAAModal.value.showModal(msfaa.id, cancelMSFAACall);
};

const cancelMSFAACall = async (
  userNoteModalResult: UserNoteModal<number>,
): Promise<boolean> => {
  try {
    await MSFAANumberService.shared.cancelMSFAANumber(
      userNoteModalResult.showParameter,
      { noteDescription: userNoteModalResult.note },
    );
    snackBar.success("The MSFAA has been successfully cancelled.");
    await loadMSFAAActivity();
    return true;
  } catch {
    snackBar.error("An unexpected error happened while cancelling the MSFAA.");
    return false;
  }
};

const reissueMSFAA = async () => {
  const msfaaToReissue = msfaaActivity.value.find(
    (msfaa) => msfaa.id === selectedMSFAAId.value,
  );
  if (!msfaaToReissue) {
    return;
  }
  await reissueMSFAAModal.value.showModal(msfaaToReissue, reissueMSFAACall);
};

const reissueMSFAACall = async (
  userNoteModalResult: UserNoteModal<MSFAANumberAPIOutDTO>,
): Promise<boolean> => {
  try {
    await MSFAANumberService.shared.reissueMSFAANumber(
      userNoteModalResult.showParameter.id,
      { noteDescription: userNoteModalResult.note },
    );
    snackBar.success("The MSFAA has been successfully issued.");
    await loadMSFAAActivity();
    return true;
  } catch {
    snackBar.error("An unexpected error happened while issuing the MSFAA.");
    return false;
  }
};

watchEffect(async () => {
  await loadMSFAAActivity();
});
</script>
