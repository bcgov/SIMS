<template>
  <v-menu class="label-bold-menu">
    <template #activator="{ props: activatorProps }">
      <v-btn
        color="primary"
        v-bind="activatorProps"
        prepend-icon="fa:fa fa-chevron-circle-down"
      >
        Program actions
      </v-btn>
    </template>
    <v-list
      active-class="active-list-item"
      density="compact"
      bg-color="default"
      color="primary"
    >
      <v-list-item :to="editProgramRoute" title="Edit" />
      <v-divider-inset-opaque />
      <v-list-item
        base-color="danger"
        @click="deactivate"
        title="Deactivate"
      />
    </v-list>
  </v-menu>
  <education-program-deactivation-modal
    ref="deactivateEducationProgramModal"
    :notes-required="false"
  />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { ModalDialog, useSnackBar } from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import EducationProgramDeactivationModal from "@/components/common/modals/EducationProgramDeactivationModal.vue";
import { DeactivateProgramAPIInDTO } from "@/services/http/dto";
import { EducationProgramService } from "@/services/EducationProgramService";

interface ProgramActionsMenuProps {
  /**
   * Program the actions are applied to.
   */
  programId: number;
}

const props = defineProps<ProgramActionsMenuProps>();
const emit = defineEmits<{
  // Program successfully deactivated.
  deactivated: [];
}>();

const snackBar = useSnackBar();

/**
 * Route to the edit program page.
 */
const editProgramRoute = computed<RouteLocationRaw>(() => ({
  name: InstitutionRoutesConst.EDIT_PROGRAM,
  params: { programId: props.programId },
}));

const deactivateEducationProgramModal = ref(
  {} as ModalDialog<DeactivateProgramAPIInDTO | boolean>,
);

/**
 * Deactivates the education program.
 */
const deactivate = async (): Promise<void> => {
  await deactivateEducationProgramModal.value.showModal(
    undefined,
    canResolvePromise,
  );
};

/**
 * Resolves the promise returned by the modal dialog.
 * @param modalResult the result from the modal dialog.
 * @returns a boolean indicating whether the promise was resolved successfully.
 */
const canResolvePromise = async (
  modalResult: DeactivateProgramAPIInDTO | boolean,
): Promise<boolean> => {
  if (modalResult === false) {
    return true;
  }
  try {
    await EducationProgramService.shared.deactivateProgram(
      props.programId,
      modalResult as DeactivateProgramAPIInDTO,
    );
    snackBar.success("Program deactivated with success.");
    emit("deactivated");
    return true;
  } catch {
    snackBar.error("An error happened while deactivating the program.");
    return false;
  }
};
</script>
