<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header title="Disability Profile">
        <template #subtitle>
          <span v-if="activeProfile">
            See below the current disability profile for this student.
          </span>
        </template>
        <template #actions>
          <v-btn
            class="float-right"
            :disabled="!!draftProfile"
            color="primary"
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
        :toggled="activeDisabilities?.length === 0"
        message="The disability profile for this student is not set yet."
      >
        <student-disability-disabilities
          :student-id="studentId"
          v-model="activeDisabilities"
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
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Archived Profiles"
        sub-title="See below the archived disability profiles for this student."
      />
    </template>
    <content-group>
      <toggle-content
        :toggled="archivedProfiles.length === 0"
        message="No archived profiles."
      >
        <v-data-table
          :headers="archivedProfileHeaders"
          :items="archivedProfiles"
          :hide-default-footer="archivedProfiles.length <= 10"
        >
          <template #item.completedAt="{ item }">
            {{ getISODateHourMinuteString(item.completedAt) }}
          </template>
          <template #item.completedBy="{ item }">
            {{ item.completedBy }}
          </template>
          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              variant="text"
              @click="viewArchivedProfile(item.id)"
              >View</v-btn
            >
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import StudentDisabilityDisabilities from "@/components/common/students/StudentDisabilityDisabilities.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { DisabilityProfileStatus, StudentDisability } from "@/types";
import { DisabilityProfileService } from "@/services/DisabilityProfileService";
import { StudentDisabilityProfileAPIOutDTO } from "@/services/http/dto";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";

const archivedProfileHeaders = [
  { title: "Completed date", key: "completedAt" },
  { title: "Completed by", key: "completedBy" },
  { title: "Actions", key: "actions", sortable: false },
];

export default defineComponent({
  components: { StudentDisabilityDisabilities, ConfirmModal },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const { getISODateHourMinuteString } = useFormatters();
    const deleteDraftModal = ref({} as ModalDialog<boolean>);
    const hasSecondaryDisability = ref(false);
    const router = useRouter();
    const activeDisabilities = ref<StudentDisability[]>([]);
    const activeProfile = ref<StudentDisabilityProfileAPIOutDTO>();
    const draftProfile = ref<StudentDisabilityProfileAPIOutDTO>();
    const archivedProfiles = ref<StudentDisabilityProfileAPIOutDTO[]>([]);

    const onSecondaryDisabilityChanged = (value: boolean) => {
      hasSecondaryDisability.value = value;
    };

    const editProfile = () => {
      router.push({
        name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_EDIT,
        params: {
          studentId: props.studentId,
          disabilityProfileId: activeProfile.value?.id,
        },
      });
    };

    const viewDraft = () => {
      router.push({
        name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_DRAFT,
        params: {
          studentId: props.studentId,
          disabilityProfileId: draftProfile.value?.id,
        },
      });
    };

    const viewArchivedProfile = (profileId: number): void => {
      router.push({
        name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_VIEW,
        params: {
          studentId: props.studentId,
          disabilityProfileId: profileId,
        },
      });
    };

    const deleteDraft = async () => {
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

    let nextUniqueKey = 1;

    const loadProfiles = async () => {
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
        activeDisabilities.value = activeProfile.value
          ? activeProfile.value.disabilities.map((disability) => ({
              ...disability,
              uniqueKey: nextUniqueKey++,
            }))
          : [];
      } catch {
        snackBar.error(
          "An unexpected error occurred while loading the student's disability profiles.",
        );
      }
    };

    watchEffect(async () => {
      await loadProfiles();
    });

    return {
      hasSecondaryDisability,
      onSecondaryDisabilityChanged,
      editProfile,
      viewDraft,
      viewArchivedProfile,
      deleteDraft,
      deleteDraftModal,
      activeProfile,
      draftProfile,
      archivedProfiles,
      activeDisabilities,
      archivedProfileHeaders,
      getISODateHourMinuteString,
    };
  },
});
</script>
