<template>
  <v-form ref="viewRestrictionForm">
    <modal-dialog-base title="View restriction" :showDialog="showDialog">
      <template #content>
        <error-summary :errors="viewRestrictionForm.errors" />
        <h3 class="category-header-medium mb-5">Restriction information</h3>
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
                :propertyValue="
                  dateOnlyLongString(restrictionData.createdAt)
                " /></v-col
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
        <template v-if="showResolution">
          <v-divider-opaque />
          <h3 class="category-header-medium mb-5">Resolution</h3>
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
                    dateOnlyLongString(restrictionData.updatedAt)
                  " /></v-col
              ><v-col
                ><title-value
                  propertyTitle="Resolved by"
                  :propertyValue="restrictionData.updatedBy" /></v-col
            ></v-row>
          </content-group>
        </template>
      </template>
      <template #footer>
        <footer-buttons
          :processing="processing"
          :primaryLabel="allowUserToEdit ? 'Resolve restriction' : 'Close'"
          secondaryLabel="Cancel"
          @primaryClick="allowUserToEdit ? submit() : cancel()"
          @secondaryClick="cancel"
          :showSecondaryButton="allowUserToEdit"
        />
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
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
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

    console.info("props.canResolveRestriction: ", props.canResolveRestriction);

    const allowUserToEdit = computed(
      () =>
        props.restrictionData.isActive &&
        props.restrictionData.restrictionType !== RestrictionType.Federal &&
        props.canResolveRestriction,
    );

    const showResolution = computed(
      () =>
        props.canResolveRestriction &&
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
      showResolution,
      dateOnlyLongString,
    };
  },
});
</script>
