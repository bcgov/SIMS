<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header title="Disability Profile">
        <template #subtitle>
          <span v-if="activeProfile">
            See below the current disability profile for this student.
          </span>
          <span v-else-if="!draftProfile">
            Click 'Edit profile' to create a new disability profile.</span
          >
        </template>
        <template #actions>
          <v-btn class="float-right" color="primary" @click="editProfile"
            >Edit profile</v-btn
          >
        </template>
      </body-header>
      <banner
        v-if="draftProfile"
        class="mb-2"
        type="warning"
        header="Draft profile"
        summary="A draft version exists for this disability profile. The draft can be updated to be completed or deleted, if no longer needed."
      >
        <template #actions>
          <v-btn color="danger" class="mr-2" @click="deleteDraft"
            >Delete draft</v-btn
          >
          <v-btn color="primary" @click="viewDraft">View draft</v-btn>
        </template>
      </banner>
    </template>
    <content-group>
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
import { ModalDialog, useSnackBar } from "@/composables";

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
        name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_EDIT,
        params: {
          studentId: props.studentId,
          disabilityProfileId: draftProfile.value?.id,
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
      deleteDraft,
      deleteDraftModal,
      activeProfile,
      draftProfile,
      archivedProfiles,
      activeDisabilities,
    };
  },
});
</script>
