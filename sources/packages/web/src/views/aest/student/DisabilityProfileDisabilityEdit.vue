<template>
  <full-page-container :full-width="false">
    <template #header>
      <header-navigator
        title="Disability Profile"
        sub-title="Student Disabilities"
        :route-location="{
          name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
          params: {
            studentId: props.studentId,
          },
        }"
      />
    </template>
    <body-header-container :enable-card-view="false">
      <template #header>
        <body-header :title="bodyHeaderTitle" :sub-title="bodyHeaderSubtitle">
          <template #actions>
            <v-btn
              prepend-icon="fas fa-save"
              class="float-right mr-2"
              color="primary"
              variant="outlined"
              :loading="processing"
              :disabled="processing"
              @click="saveDraftProfile"
              >{{ isDraft ? "Save draft" : "Save as draft" }}</v-btn
            >
          </template>
        </body-header>
      </template>
    </body-header-container>
    <content-group>
      <student-disability-disabilities
        ref="disabilitiesComponent"
        :student-id="props.studentId"
        :disability-profile-id="props.disabilityProfileId"
        :read-only="false || processing"
      />
    </content-group>
    <footer-buttons
      primary-label="Complete change"
      @primary-click="completeProfile"
      @secondary-click="cancelProfile"
      :secondary-label="isDraft ? 'Cancel draft' : 'Cancel'"
      :processing="processing"
    ></footer-buttons>
  </full-page-container>
  <confirm-modal
    title="Delete draft"
    ref="deleteDraftModal"
    ok-label="Delete draft"
    text="Are you sure you want to delete the draft disability profile?"
  />
  <confirm-modal
    title="Complete change"
    ref="completeChangeModal"
    ok-label="Complete change"
    text="Are you sure you want to complete the change to the disability profile? This will make this version of the profile active."
  />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import type { StudentDisability } from "@/types";
import { SaveStudentDisabilityProfileAPIInDTO } from "@/services/http/dto";
import { DisabilityProfileService } from "@/services/DisabilityProfileService";
import { ModalDialog, useSnackBar } from "@/composables";
import { useRouter } from "vue-router";
import StudentDisabilityDisabilities from "@/components/common/students/StudentDisabilityDisabilities.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

interface Props {
  studentId: number;
  disabilityProfileId?: number;
  isDraft?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabilityProfileId: undefined,
  isDraft: false,
});

const snackBar = useSnackBar();
const router = useRouter();
const disabilitiesComponent =
  ref<InstanceType<typeof StudentDisabilityDisabilities>>();
const deleteDraftModal = ref({} as ModalDialog<boolean>);
const completeChangeModal = ref({} as ModalDialog<boolean>);
const processing = ref(false);

const bodyHeaderTitle = computed(() => {
  if (props.isDraft) {
    return "Draft Disability Profile";
  }
  return "Current Disability Profile";
});

const bodyHeaderSubtitle = computed(() => {
  if (props.isDraft) {
    return "Drafts can be saved and updated repeatedly until you choose to complete or delete them.";
  }
  return "Changes to the current disability profile can be completed directly, or saved as a draft if more time is needed before finalizing.";
});

const createPayload = (
  disabilities: StudentDisability[],
): SaveStudentDisabilityProfileAPIInDTO => {
  return {
    // Only include the ID in the payload if it's a draft that must be updated to be active,
    // otherwise the API will create a new active profile instead of updating the existing draft profile.
    id: props.isDraft ? props.disabilityProfileId : undefined,
    disabilities: disabilities.map((disability) => ({
      id: disability.id,
      disabilityPriority: disability.disabilityPriority,
      disabilityCategory: disability.disabilityCategory,
      disabilityType: disability.disabilityType,
      disabilityNotes: disability.disabilityNotes,
      diagnosis: disability.diagnosis,
      diagnosisNotes: disability.diagnosisNotes,
      impairments: disability.impairments,
      impairmentsNotes: disability.impairmentsNotes,
      finalNotes: disability.finalNotes,
    })),
  };
};

const saveDraftProfile = async (): Promise<void> => {
  const isValid = await disabilitiesComponent.value?.validateDisabilityForms();
  if (!isValid) {
    snackBar.error(
      "The draft was not saved. Please review the validation messages.",
    );
    return;
  }
  try {
    processing.value = true;
    const result = await DisabilityProfileService.shared.saveDraftProfile(
      props.studentId,
      createPayload(disabilitiesComponent.value?.getDisabilities() ?? []),
    );
    if (props.isDraft) {
      await disabilitiesComponent.value?.reloadData();
      snackBar.success("Draft saved successfully.");
      return;
    }
    snackBar.success("Draft created successfully.");
    await router.push({
      name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_DRAFT,
      params: {
        studentId: props.studentId,
        disabilityProfileId: result.id,
      },
    });
  } catch {
    snackBar.error("Unexpected error occurred while saving the draft.");
  } finally {
    processing.value = false;
  }
};

const completeProfile = async (): Promise<void> => {
  const isValid = await disabilitiesComponent.value?.validateDisabilityForms();
  if (!isValid) {
    snackBar.error(
      "The profile was not completed. Please review the validation messages.",
    );
    return;
  }
  const confirmed = await completeChangeModal.value.showModal();
  if (!confirmed) {
    return;
  }
  try {
    processing.value = true;
    await DisabilityProfileService.shared.saveActiveProfile(
      props.studentId,
      createPayload(disabilitiesComponent.value?.getDisabilities() ?? []),
    );
    snackBar.success("Profile completed successfully.");
    await router.push({
      name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
      params: {
        studentId: props.studentId,
      },
    });
  } catch {
    snackBar.error("Unexpected error occurred while completing the profile.");
  } finally {
    processing.value = false;
  }
};

const cancelProfile = async (): Promise<void> => {
  if (!props.isDraft) {
    await router.push({
      name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
      params: {
        studentId: props.studentId,
      },
    });
    return;
  }
  const confirmed = await deleteDraftModal.value.showModal();
  if (!confirmed) {
    return;
  }
  try {
    processing.value = true;
    await DisabilityProfileService.shared.deleteDraftProfile(
      props.disabilityProfileId!,
    );
    snackBar.success("Draft deleted successfully.");
    await router.push({
      name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
      params: {
        studentId: props.studentId,
      },
    });
  } catch {
    snackBar.error(
      "An unexpected error occurred while deleting the draft disability profile.",
    );
  } finally {
    processing.value = false;
  }
};
</script>
