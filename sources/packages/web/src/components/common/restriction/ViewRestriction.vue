<template>
  <v-form ref="viewRestrictionForm">
    <modal-dialog-base title="View restriction" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="viewRestrictionForm.errors" />
        <h3 class="category-header-medium">Restriction information</h3>
        <content-group>
          <title-value
            property-title="Category"
            :property-value="restrictionData.restrictionCategory"
          />
          <title-value
            property-title="Reason"
            :property-value="restrictionData.description"
          />
          <title-value
            v-if="restrictionData.restrictionNote"
            property-title="Notes"
            :property-value="restrictionData.restrictionNote"
          />
          <v-row
            ><v-col
              ><title-value
                property-title="Date created"
                :property-value="
                  dateOnlyLongString(restrictionData.createdAt)
                " /></v-col
            ><v-col
              ><title-value
                property-title="Created by"
                :property-value="restrictionData.createdBy" /></v-col
            ><v-col
              ><title-value property-title="Status" /><status-chip-restriction
                :is-active="restrictionData.isActive"
                :deleted-at="restrictionData.deletedAt" /></v-col
          ></v-row>
        </content-group>
        <template v-if="showResolution">
          <h3 class="category-header-medium mt-2">Resolution</h3>
          <v-textarea
            v-if="allowUserToEdit"
            label="Resolution reason"
            v-model="formModel.resolutionNote"
            variant="outlined"
            :rules="[(v) => checkNotesLengthRule(v, 'Resolution Reason')]"
          />
          <content-group
            v-if="
              !restrictionData.isActive &&
              restrictionData.restrictionType !== RestrictionType.Federal
            "
          >
            <title-value
              property-title="Resolution reason"
              :property-value="restrictionData.resolutionNote"
            />
            <v-row
              ><v-col
                ><title-value
                  property-title="Date resolved"
                  :property-value="
                    dateOnlyLongString(restrictionData.resolvedAt)
                  " /></v-col
              ><v-col
                ><title-value
                  property-title="Resolved by"
                  :property-value="restrictionData.resolvedBy" /></v-col
            ></v-row>
          </content-group>
        </template>
        <template v-if="showDeletion">
          <h3 class="category-header-medium mt-2">Deletion</h3>
          <content-group>
            <title-value
              property-title="Deletion reason"
              :property-value="restrictionData.deletionNote"
            />
            <v-row
              ><v-col
                ><title-value
                  property-title="Date deleted"
                  :property-value="
                    dateOnlyLongString(restrictionData.deletedAt)
                  " /></v-col
              ><v-col
                ><title-value
                  property-title="Deleted by"
                  :property-value="restrictionData.deletedBy" /></v-col
            ></v-row>
          </content-group>
        </template>
      </template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :primary-label="allowUserToEdit ? 'Resolve restriction' : 'Close'"
              secondary-label="Cancel"
              @primary-click="allowUserToEdit ? submit() : cancel()"
              @secondary-click="cancel"
              :disable-primary-button="allowUserToEdit && notAllowed"
              :show-secondary-button="allowUserToEdit"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useFormatters, useModalDialog, useRules } from "@/composables";
import { Role, RestrictionType } from "@/types";
import type { VForm } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

interface Props {
  restrictionData: RestrictionDetailAPIOutDTO;
  allowedRole: Role;
  canResolveRestriction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canResolveRestriction: false,
});

const { checkNotesLengthRule } = useRules();
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
  const payload = { ...formModel };
  const resolved = await resolvePromise(payload);
  if (resolved) {
    viewRestrictionForm.value.reset();
  }
};

const cancel = () => {
  viewRestrictionForm.value.reset();
  resolvePromise(false);
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

defineExpose({
  showModal,
});
</script>
