<template>
  <full-page-container :full-width="false">
    <template #header>
      <header-navigator
        title="Disability Profile"
        :sub-title="
          isDraft ? 'Student Disabilities - Draft' : 'Student Disabilities'
        "
        :route-location="{
          name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
          params: {
            studentId: studentId,
          },
        }"
      />
    </template>
    <body-header-container :enable-card-view="false">
      <template #header>
        <body-header title="Disability Profile">
          <template #actions v-if="!readOnly">
            <v-btn
              prepend-icon="fas fa-save"
              class="float-right mr-2"
              color="primary"
              variant="outlined"
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
        :student-id="studentId"
        :disability-profile-id="disabilityProfileId"
        :read-only="readOnly"
        v-model="disabilities"
      />
    </content-group>
    <footer-buttons
      v-if="!readOnly"
      primary-label="Complete change"
      @primary-click="completeProfile"
      @secondary-click="cancelProfile"
      :secondary-label="isDraft ? 'Cancel draft' : 'Cancel'"
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
import { ref } from "vue";
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
  readOnly?: boolean;
  isDraft?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabilityProfileId: undefined,
  readOnly: false,
  isDraft: false,
});

const snackBar = useSnackBar();
const router = useRouter();
const disabilitiesComponent =
  ref<InstanceType<typeof StudentDisabilityDisabilities>>();
const disabilities = ref<StudentDisability[]>([]);
const deleteDraftModal = ref({} as ModalDialog<boolean>);
const completeChangeModal = ref({} as ModalDialog<boolean>);

const createPayload = (): SaveStudentDisabilityProfileAPIInDTO => ({
  // Only include the id in the payload if it's a draft that must be updated to be active,
  // otherwise the API will create a new active profile instead of updating the existing draft profile.
  id: props.isDraft ? props.disabilityProfileId : undefined,
  disabilities: disabilities.value.map((disability) => ({
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
});

const saveDraftProfile = async (): Promise<void> => {
  const isValid = await disabilitiesComponent.value?.validateDisabilityForms();
  if (!isValid) {
    snackBar.warn(
      "Some mandatory fields are missing or contain invalid values. Please review the form and try again.",
    );
    return;
  }
  try {
    const result = await DisabilityProfileService.shared.saveDraftProfile(
      props.studentId,
      createPayload(),
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
  }
};

const completeProfile = async (): Promise<void> => {
  const isValid = await disabilitiesComponent.value?.validateDisabilityForms();
  if (!isValid) {
    snackBar.warn(
      "Some mandatory fields are missing or contain invalid values. Please review the form and try again.",
    );
    return;
  }
  const confirmed = await completeChangeModal.value.showModal();
  if (!confirmed) {
    return;
  }
  try {
    await DisabilityProfileService.shared.saveActiveProfile(
      props.studentId,
      createPayload(),
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
    await DisabilityProfileService.shared.deleteDraftProfile(
      props.studentId,
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
  }
};
</script>
