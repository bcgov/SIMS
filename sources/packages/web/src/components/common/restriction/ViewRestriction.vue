<template>
  <v-form ref="viewRestrictionForm">
    <modal-dialog-base title="View restriction" :showDialog="showDialog">
      <template #content>
        <error-summary :errors="viewRestrictionForm.errors" />
        <h4
          class="category-header-medium mb-5"
          v-if="!restrictionData.isActive"
        >
          Restriction information
        </h4>
        <content-group>
          <title-value
            propertyTitle="Category"
            :propertyValue="restrictionData.restrictionCategory"
          />
          <title-value
            propertyTitle="Reason"
            :propertyValue="restrictionData.description"
          />
          <title-value
            propertyTitle="Notes"
            :propertyValue="restrictionData.restrictionNote"
          />
          <v-row
            ><v-col
              ><title-value
                propertyTitle="Date created"
                :propertyValue="restrictionData.createdAt" /></v-col
            ><v-col
              ><title-value
                propertyTitle="Created by"
                :propertyValue="restrictionData.createdBy" /></v-col
            ><v-col
              ><title-value propertyTitle="Status" /><status-chip-restriction
                :status="
                  restrictionData.isActive
                    ? RestrictionStatus.Active
                    : RestrictionStatus.Resolved
                " /></v-col
          ></v-row>
        </content-group>
        <v-divider v-if="allowUserToEdit"></v-divider>
        <v-textarea
          v-if="allowUserToEdit"
          label="Resolution reason"
          placeholder="Long text..."
          v-model="formModel.resolutionNote"
          variant="outlined"
          :rules="[(v) => checkResolutionNotesLength(v)]" />
        <h4
          class="category-header-medium mb-5"
          v-if="!restrictionData.isActive"
        >
          Resolution
        </h4>
        <content-group v-if="!restrictionData.isActive">
          <title-value
            propertyTitle="Resolution reason"
            :propertyValue="restrictionData.resolutionNote"
          />
          <v-row
            ><v-col
              ><title-value
                propertyTitle="Date resolved"
                :propertyValue="restrictionData.updatedAt" /></v-col
            ><v-col
              ><title-value
                propertyTitle="Resolved by"
                :propertyValue="restrictionData.updatedBy" /></v-col
          ></v-row> </content-group
      ></template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primaryLabel="Resolve restriction"
              :secondaryLabel="allowUserToEdit ? 'Cancel' : 'Close'"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
              :showPrimaryButton="allowUserToEdit"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { PropType, ref, reactive, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useValidators } from "@/composables";
import { Role, RestrictionType, VForm, RestrictionStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

export default {
  components: {
    ModalDialogBase,
    CheckPermissionRole,
    ErrorSummary,
    StatusChipRestriction,
    TitleValue,
  },
  props: {
    restrictionData: {
      type: Object as PropType<RestrictionDetailAPIOutDTO>,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup(props: any) {
    const NOTES_MAX_CHARACTERS = 500;
    const { checkMaxCharacters } = useValidators();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      RestrictionDetailAPIOutDTO | false
    >();
    const viewRestrictionForm = ref({} as VForm);
    const formModel = reactive({} as RestrictionDetailAPIOutDTO);

    const submit = async () => {
      const validationResult = await viewRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      formModel.restrictionId = props.restrictionData.restrictionId;
      resolvePromise(formModel);
    };

    const cancel = () => {
      viewRestrictionForm.value.reset();
      viewRestrictionForm.value.resetValidation();
      resolvePromise(false);
    };

    const checkResolutionNotesLength = (notes: string) => {
      if (notes) {
        return (
          checkMaxCharacters(notes, NOTES_MAX_CHARACTERS) ||
          `Max ${NOTES_MAX_CHARACTERS} characters.`
        );
      }
      return "Resolution reason is required.";
    };

    const allowUserToEdit = computed(
      () =>
        props.restrictionData.isActive &&
        props.restrictionData.restrictionType !== RestrictionType.Federal,
    );

    return {
      showDialog,
      showModal,
      RestrictionType,
      submit,
      cancel,
      viewRestrictionForm,
      Role,
      formModel,
      RestrictionStatus,
      checkResolutionNotesLength,
      allowUserToEdit,
    };
  },
};
</script>
