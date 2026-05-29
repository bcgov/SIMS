<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Disability Profile"
        sub-title="Current disability profile details."
      >
        <template #actions>
          <v-btn
            class="float-right"
            :disabled="!!draftProfile"
            color="primary"
            prepend-icon="fa:fa fa-edit"
            @click="editProfile"
            >{{ activeProfile ? "Edit profile" : "Create profile" }}</v-btn
          >
        </template>
      </body-header>
    </template>
    <content-group>
      <banner
        v-if="draftProfile"
        class="mb-2"
        type="warning"
        header="Draft profile"
      >
        <template #content>
          <span
            >A draft version exists for this disability profile. The draft can
            be updated to be completed or deleted, if no longer needed.<br />The
            <b>Edit profile</b> button is not available until the draft is
            completed or deleted.</span
          >
        </template>
        <template #actions>
          <v-btn color="primary" class="mr-2" @click="viewDraft"
            >View draft</v-btn
          >
          <v-btn color="danger" @click="deleteDraft">
            <v-icon icon="fas fa-trash" />
          </v-btn>
        </template>
      </banner>
      <toggle-content
        :toggled="!activeProfile"
        message="No disability profile set."
      >
        <student-disability-disabilities
          :student-id="studentId"
          :disability-profile-id="activeProfile?.id"
          :read-only="true"
        />
      </toggle-content>
    </content-group>
  </body-header-container>
  <confirm-modal
    title="Delete draft"
    ref="deleteDraftModal"
    ok-label="Delete draft"
    text="Are you sure you want to delete the draft disability profile?"
  />
  <body-header-container
    :enable-card-view="true"
    v-if="archivedProfiles.length"
  >
    <template #header>
      <body-header title="History" sub-title="Disability profile history." />
    </template>
    <content-group>
      <v-data-table
        :headers="DisabilityProfileArchivedHeaders"
        :items="archivedProfiles"
        :hide-default-footer="archivedProfiles.length <= 10"
      >
        <template #[`item.completedAt`]="{ item }">
          <span style="white-space: nowrap">{{
            getISODateHourMinuteString(item.completedAt)
          }}</span>
        </template>
        <template #[`item.completedBy`]="{ item }">
          {{ item.completedBy }}
        </template>
        <template #[`item.disabilities`]="{ item }">
          <div style="display: flex; flex-wrap: wrap; gap: 4px">
            <v-chip
              v-for="disability in item.disabilities"
              :key="disability.disabilityPriority"
              size="small"
              color="secondary"
              variant="tonal"
            >
              {{ disability.disabilityCategoryDescription }}
            </v-chip>
          </div>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn color="primary" @click="viewArchivedProfile(item.id)"
            >View</v-btn
          >
        </template>
      </v-data-table>
    </content-group>
  </body-header-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import StudentDisabilityDisabilities from "@/components/common/students/StudentDisabilityDisabilities.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  DisabilityProfileStatus,
  DisabilityProfileArchivedHeaders,
} from "@/types";
import { DisabilityProfileService } from "@/services/DisabilityProfileService";
import type { StudentDisabilityProfileAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";
import type { ModalDialog } from "@/composables";

interface Props {
  studentId: number;
}

const props = defineProps<Props>();

const snackBar = useSnackBar();
const { getISODateHourMinuteString } = useFormatters();
const deleteDraftModal = ref({} as ModalDialog<boolean>);
const router = useRouter();
const activeProfile = ref<StudentDisabilityProfileAPIOutDTO>();
const draftProfile = ref<StudentDisabilityProfileAPIOutDTO>();
const archivedProfiles = ref<StudentDisabilityProfileAPIOutDTO[]>([]);

const editProfile = (): void => {
  void router.push({
    name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_EDIT,
    params: {
      studentId: props.studentId,
      disabilityProfileId: activeProfile.value?.id,
    },
  });
};

const viewDraft = (): void => {
  void router.push({
    name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_DRAFT,
    params: {
      studentId: props.studentId,
      disabilityProfileId: draftProfile.value?.id,
    },
  });
};

const viewArchivedProfile = (profileId: number): void => {
  void router.push({
    name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_VIEW,
    params: {
      studentId: props.studentId,
      disabilityProfileId: profileId,
    },
  });
};

const deleteDraft = async (): Promise<void> => {
  const confirmed = await deleteDraftModal.value.showModal();
  if (!confirmed) {
    return;
  }
  try {
    await DisabilityProfileService.shared.deleteDraftProfile(
      props.studentId,
      draftProfile.value!.id,
    );
    snackBar.success("Draft deleted successfully.");
    await loadProfiles();
  } catch {
    snackBar.error(
      "An unexpected error occurred while deleting the draft disability profile.",
    );
  }
};

const loadProfiles = async (): Promise<void> => {
  try {
    const { profiles } =
      await DisabilityProfileService.shared.getStudentDisabilityProfiles(
        props.studentId,
      );
    activeProfile.value = profiles.find(
      (profile) => profile.status === DisabilityProfileStatus.Active,
    );
    draftProfile.value = profiles.find(
      (profile) => profile.status === DisabilityProfileStatus.Draft,
    );
    archivedProfiles.value = profiles.filter(
      (profile) => profile.status === DisabilityProfileStatus.Archived,
    );
  } catch {
    snackBar.error(
      "An unexpected error occurred while loading the student's disability profiles.",
    );
  }
};

watchEffect(async () => {
  await loadProfiles();
});
</script>
