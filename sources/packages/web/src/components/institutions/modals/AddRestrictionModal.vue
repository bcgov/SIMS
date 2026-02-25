<template>
  <v-form ref="addRestrictionForm">
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
          :rules="[(v) => checkNullOrEmptyRule(v, 'Reason')]"
          :loading="loadingData"
          @update:model-value="resetFormModelValues()"
          hide-details="auto" />
        <v-autocomplete
          v-if="programAttributes.canShow"
          item-value="id"
          item-title="description"
          class="mb-4"
          label="Program"
          density="compact"
          :items="programs"
          v-model="formModel.programId"
          variant="outlined"
          :rules="programAttributes.rules"
          :loading="loadingData"
          :clearable="true"
          hide-details="auto" />
        <v-select
          v-if="locationAttributes.canShow"
          item-value="id"
          item-title="name"
          class="mb-4"
          label="Location(s)"
          density="compact"
          :items="locations"
          v-model="formModel.locationIds"
          variant="outlined"
          :rules="locationAttributes.rules"
          :loading="loadingData"
          clearable
          multiple
          chips
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
import { ref, reactive, defineComponent, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useRules, useSnackBar } from "@/composables";
import { VForm, RestrictionType, FieldRequirementType } from "@/types";
import {
  AssignInstitutionRestrictionAPIInDTO,
  InstitutionLocationAPIOutDTO,
  OptionItemAPIOutDTO,
  RestrictionAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { RestrictionService } from "@/services/RestrictionService";
import { EducationProgramService } from "@/services/EducationProgramService";
const LOCATION_FIELD_KEY = "location";
const PROGRAM_FIELD_KEY = "program";
interface FieldAttributes {
  canShow: boolean;
  rules?: ((v: string | number) => true | string)[];
}

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
    const { checkNotesLengthRule, checkNullOrEmptyRule } = useRules();
    const reasons = ref([] as RestrictionAPIOutDTO[]);
    const locations = ref([] as InstitutionLocationAPIOutDTO[]);
    const programs = ref([] as OptionItemAPIOutDTO[]);
    const formModel = reactive({} as AssignInstitutionRestrictionAPIInDTO);
    const loadingData = ref(false);
    const submittingData = ref(false);
    const addRestrictionForm = ref({} as VForm);
    /**
     * Get field attributes.
     * @param fieldKey field key to get the attributes for.
     * @param friendlyName friendly name of the field.
     */
    const getFieldAttributes = (
      fieldKey: string,
      friendlyName: string,
    ): FieldAttributes => {
      const selectedReason = reasons.value.find(
        (reason) => reason.id === formModel.restrictionId,
      );
      if (!selectedReason?.fieldRequirements) {
        return { canShow: false };
      }
      const fieldRequirement = selectedReason.fieldRequirements[fieldKey];
      const canShow = fieldRequirement !== FieldRequirementType.NotAllowed;
      const rules =
        fieldRequirement === FieldRequirementType.Required
          ? [(v: string | number) => checkNullOrEmptyRule(v, friendlyName)]
          : [];
      return {
        canShow,
        rules,
      };
    };

    const locationAttributes = computed(() => {
      return getFieldAttributes(LOCATION_FIELD_KEY, "Location(s)");
    });

    const programAttributes = computed(() => {
      return getFieldAttributes(PROGRAM_FIELD_KEY, "Program");
    });

    /**
     * Resets the form model values based on the visibility of the fields.
     * This is required to avoid sending invalid data to the API in case the user changes the reason after filling some fields.
     */
    const resetFormModelValues = () => {
      if (!locationAttributes.value.canShow) {
        formModel.locationIds = [];
      }
      if (!programAttributes.value.canShow) {
        formModel.programId = undefined;
      }
    };
    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
    } = useModalDialog<AssignInstitutionRestrictionAPIInDTO | false>();

    /**
     * Overrides the showModal method to allow loading the data only if the modal is invoked.
     * @param params Optional params not used for this modal.
     * @param canResolvePromise indicates when the modal have its promise resolved.
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
        snackBar.error(
          "Unexpected error while loading institution restriction-related information.",
        );
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
      addRestrictionForm,
      formModel,
      reasons,
      locations,
      programs,
      checkNotesLengthRule,
      checkNullOrEmptyRule,
      locationAttributes,
      programAttributes,
      resetFormModelValues,
    };
  },
});
</script>
