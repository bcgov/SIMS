<template>
  <v-form ref="addRestrictionForm">
    <modal-dialog-base title="Add new restriction" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="addRestrictionForm.errors" />
        <v-select
          item-value="id"
          item-title="description"
          class="my-2"
          label="Reason"
          density="compact"
          :items="reasons"
          v-model="formModel.restrictionId"
          variant="outlined"
          :rules="[(v) => !!v || 'Reason is required.']"
          :loading="loadingData"
          hide-details="auto" />
        <v-autocomplete
          item-value="id"
          item-title="description"
          class="mb-2"
          label="Program"
          density="compact"
          :items="programs"
          v-model="formModel.programId"
          variant="outlined"
          :rules="[(v) => !!v || 'Program is required.']"
          :loading="loadingData"
          :clearable="true"
          hide-details="auto" />
        <v-select
          item-value="id"
          item-title="name"
          class="mb-2"
          label="Location"
          density="compact"
          :items="locations"
          v-model="formModel.locationId"
          variant="outlined"
          :rules="[(v) => !!v || 'Location is required.']"
          :loading="loadingData"
          hide-details="auto" />
        <v-textarea
          label="Notes"
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[checkNotesLengthRule]"
          hide-details="auto"
      /></template>
      <template #footer>
        <footer-buttons
          :disable-primary-button="loadingData"
          :processing="submittingData"
          primary-label="Add Restriction"
          @primary-click="submit"
          @secondary-click="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useRules, useSnackBar } from "@/composables";
import { Role, VForm, RestrictionType } from "@/types";
import {
  AssignInstitutionRestrictionAPIInDTO,
  InstitutionLocationAPIOutDTO,
  OptionItemAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { RestrictionService } from "@/services/RestrictionService";
import { EducationProgramService } from "@/services/EducationProgramService";

/**
 * Default category to be displayed for institution restrictions.
 */
export const CATEGORY = "Other";

export default defineComponent({
  components: { ModalDialogBase, ErrorSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const { checkNotesLengthRule } = useRules();
    const reasons = ref([] as OptionItemAPIOutDTO[]);
    const locations = ref([] as InstitutionLocationAPIOutDTO[]);
    const programs = ref([] as OptionItemAPIOutDTO[]);
    const selectedReason = ref<number>();
    const selectedLocation = ref<number>();
    const selectedProgram = ref<number>();
    const loadingData = ref(false);
    const submittingData = ref(false);

    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
    } = useModalDialog<AssignInstitutionRestrictionAPIInDTO | false>();
    const addRestrictionForm = ref({} as VForm);
    const formModel = reactive({} as AssignInstitutionRestrictionAPIInDTO);

    /**
     * Overrides the showModal method to allow loading the data
     * only if the modal is invoked.
     */
    const showModal = async (
      params: unknown,
      canResolvePromise: (
        value: AssignInstitutionRestrictionAPIInDTO | false,
      ) => Promise<boolean>,
    ) => {
      // Show the modal right away to allow the UI to display the loading states.
      showModalInternal(params, canResolvePromise);
      if (
        reasons.value.length &&
        locations.value.length &&
        programs.value.length
      ) {
        // Data is already loaded.
        // All data is expected to have items to be displayed.
        // In case some fail, it will retry if modal is shown again.
        return;
      }
      try {
        loadingData.value = true;
        const [reasonsResponse, locationsResponse, programsResponse] =
          await Promise.all([
            RestrictionService.shared.getRestrictionReasons(
              RestrictionType.Institution,
              CATEGORY,
            ),
            InstitutionService.shared.getAllInstitutionLocations(
              props.institutionId,
            ),
            EducationProgramService.shared.getProgramsListForInstitutions({
              institutionId: props.institutionId,
            }),
          ]);
        reasons.value = reasonsResponse;
        locations.value = locationsResponse;
        programs.value = programsResponse;
      } catch {
        snackBar.error("Unexpected error while loading data.");
      } finally {
        loadingData.value = false;
      }
    };

    const submit = async () => {
      const validationResult = await addRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      submittingData.value = true;
      try {
        const modalClosed = await resolvePromise(formModel);
        if (modalClosed) {
          addRestrictionForm.value.reset();
        }
      } finally {
        submittingData.value = false;
      }
    };

    const cancel = () => {
      addRestrictionForm.value.reset();
      resolvePromise(false);
    };

    return {
      loadingData,
      submittingData,
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addRestrictionForm,
      formModel,
      reasons,
      locations,
      programs,
      selectedReason,
      selectedLocation,
      selectedProgram,
      checkNotesLengthRule,
    };
  },
});
</script>
