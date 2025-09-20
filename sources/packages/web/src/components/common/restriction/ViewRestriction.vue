<template>
  <v-form ref="viewRestrictionForm">
    <modal-dialog-base title="View restriction" :showDialog="showDialog">
      <template #content>
        <error-summary :errors="viewRestrictionForm.errors" />
        <h3 class="category-header-medium mb-2">Restriction information</h3>
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
            v-if="restrictionData.restrictionNote"
            propertyTitle="Notes"
            :propertyValue="restrictionData.restrictionNote"
          />
          <v-row
            ><v-col
              ><title-value
                propertyTitle="Date created"
                :propertyValue="
                  dateOnlyLongString(restrictionData.createdAt)
                " /></v-col
            ><v-col
              ><title-value
                propertyTitle="Created by"
                :propertyValue="restrictionData.createdBy" /></v-col
            ><v-col
              ><title-value propertyTitle="Status" /><status-chip-restriction
                :is-active="restrictionData.isActive"
                :deleted-at="restrictionData.deletedAt" /></v-col
          ></v-row>
        </content-group>
        <template v-if="showResolution">
          <h3 class="category-header-medium my-2">Resolution</h3>
          <v-textarea
            v-if="allowUserToEdit"
            label="Resolution reason"
            v-model="formModel.resolutionNote"
            variant="outlined"
            :rules="[(v) => checkResolutionNotesLength(v)]"
          />
          <content-group
            v-if="
              !restrictionData.isActive &&
              restrictionData.restrictionType !== RestrictionType.Federal
            "
          >
            <title-value
              propertyTitle="Resolution reason"
              :propertyValue="restrictionData.resolutionNote"
            />
            <v-row
              ><v-col
                ><title-value
                  propertyTitle="Date resolved"
                  :propertyValue="
                    dateOnlyLongString(restrictionData.resolvedAt)
                  " /></v-col
              ><v-col
                ><title-value
                  propertyTitle="Resolved by"
                  :propertyValue="restrictionData.resolvedBy" /></v-col
            ></v-row>
          </content-group>
        </template>
        <template v-if="showDeletion">
          <h3 class="category-header-medium mt-2">Deletion</h3>
          <content-group v-if="!!restrictionData.deletedAt">
            <title-value
              propertyTitle="Deletion reason"
              :propertyValue="restrictionData.deletionNote"
            />
            <v-row
              ><v-col
                ><title-value
                  propertyTitle="Date deleted"
                  :propertyValue="
                    dateOnlyLongString(restrictionData.deletedAt)
                  " /></v-col
              ><v-col
                ><title-value
                  propertyTitle="Deleted by"
                  :propertyValue="restrictionData.deletedBy" /></v-col
            ></v-row>
          </content-group>
        </template>
      </template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :primaryLabel="allowUserToEdit ? 'Resolve restriction' : 'Close'"
              secondaryLabel="Cancel"
              @primaryClick="allowUserToEdit ? submit() : cancel()"
              @secondaryClick="cancel"
              :disablePrimaryButton="allowUserToEdit && notAllowed"
              :showSecondaryButton="allowUserToEdit"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { PropType, ref, reactive, computed, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useFormatters, useModalDialog, useValidators } from "@/composables";
import { Role, RestrictionType, VForm, RestrictionStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

export default defineComponent({
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
    canResolveRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const NOTES_MAX_CHARACTERS = 500;
    const { checkMaxCharacters } = useValidators();
    const { dateOnlyLongString } = useFormatters();
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
        !props.restrictionData.deletedAt &&
        props.restrictionData.isActive &&
        props.restrictionData.restrictionType !== RestrictionType.Federal &&
        props.canResolveRestriction,
    );

    const showResolution = computed(() => {
      if (props.restrictionData.deletedAt) {
        // Show resolution section if the restriction was deleted, but has some note.
        return !!props.restrictionData.resolutionNote;
      }
      return (
        props.canResolveRestriction &&
        props.restrictionData.restrictionType !== RestrictionType.Federal &&
        // If no resolution note is present, consider no resolution was provided.
        // For instance, resolved provincial restrictions imported from legacy
        // will not have a resolution associated with it.
        (props.restrictionData.isActive || props.restrictionData.resolutionNote)
      );
    });

    const showDeletion = computed(() => {
      return !!props.restrictionData.deletedAt;
    });

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
      showResolution,
      showDeletion,
      dateOnlyLongString,
    };
  },
});
</script>
