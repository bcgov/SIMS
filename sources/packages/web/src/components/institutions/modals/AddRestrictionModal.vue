<template>
  <v-form ref="addRestrictionForm" validate-on="submit">
    <modal-dialog-base title="Add new restriction" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="addRestrictionForm.errors" />
        <v-select
          item-value="id"
          item-title="description"
          class="my-4"
          label="Reason"
          density="compact"
          :items="reasons"
          v-model="formModel.restrictionId"
          variant="outlined"
          :rules="[(v) => !!v || 'Reason is required.']"
          :loading="processing"
          hide-details />
        <v-autocomplete
          item-value="id"
          item-title="description"
          class="mb-4"
          label="Program"
          density="compact"
          :items="programs"
          v-model="formModel.programId"
          variant="outlined"
          :rules="[(v) => !!v || 'Program is required.']"
          :loading="processing"
          :clearable="true"
          hide-details />
        <v-select
          item-value="id"
          item-title="name"
          class="mb-4"
          label="Location"
          density="compact"
          :items="locations"
          v-model="formModel.locationId"
          variant="outlined"
          :rules="[(v) => !!v || 'Location is required.']"
          :loading="processing"
          hide-details />
        <v-textarea
          label="Notes"
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[checkNotesLengthRule]"
          hide-details
      /></template>
      <template #footer>
        <footer-buttons
          :processing="processing"
          primary-label="Add Restriction"
          @primary-click="submit"
          @secondary-click="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ref, reactive, defineComponent, watchEffect } from "vue";
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
    const processing = ref(false);

    const { showDialog, showModal, resolvePromise } = useModalDialog<
      AssignInstitutionRestrictionAPIInDTO | false
    >();
    const addRestrictionForm = ref({} as VForm);
    const formModel = reactive({} as AssignInstitutionRestrictionAPIInDTO);

    watchEffect(async () => {
      // TODO: Move to load data only when modal is shown.
      try {
        processing.value = true;
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
        processing.value = false;
      }
    });

    const submit = async () => {
      const validationResult = await addRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise(formModel);
    };

    const cancel = () => {
      addRestrictionForm.value.reset();
      resolvePromise(false);
    };

    return {
      processing,
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
