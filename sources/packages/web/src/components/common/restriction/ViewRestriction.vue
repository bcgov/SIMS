<template>
  <v-form ref="viewRestrictionForm">
    <!-- TODO min-width has to be confirmed  -->
    <modal-dialog-base
      title="View restriction"
      :showDialog="showDialog"
      max-width="730"
      min-width="730"
    >
      <template #content>
        <error-summary :errors="viewRestrictionForm.errors" />
        <h4 class="font-weight-bold" v-if="!restrictionData.isActive">
          Restriction information
        </h4>
        <content-group>
          <p class="font-weight-bold">Category</p>
          <p>{{ restrictionData.restrictionCategory }}</p>
          <p class="font-weight-bold">Reason</p>
          <p>{{ restrictionData.description }}</p>
          <p class="font-weight-bold">Notes</p>
          <p>{{ restrictionData.restrictionNote }}</p>
          <v-row
            ><v-col class="font-weight-bold">Date created</v-col
            ><v-col class="font-weight-bold">Created by</v-col
            ><v-col class="font-weight-bold">Status</v-col></v-row
          >
          <v-row
            ><v-col>{{ restrictionData.createdAt }}</v-col
            ><v-col>{{ restrictionData.createdBy }}</v-col
            ><v-col
              ><status-chip-restriction
                :status="
                  restrictionData.isActive
                    ? RestrictionStatus.Active
                    : RestrictionStatus.Resolved
                " /></v-col
          ></v-row>
        </content-group>
        <v-divider></v-divider>
        <v-textarea
          v-if="restrictionData.isActive"
          label="Resolution reason"
          placeholder="Long text..."
          v-model="formModel.resolutionNote"
          variant="outlined"
          :rules="[(v) => !!v || 'Resolution reason is required']"
        />
        <h4 class="font-weight-bold" v-if="!restrictionData.isActive">
          Resolution
        </h4>
        <content-group v-if="!restrictionData.isActive">
          <p class="font-weight-bold">Resolution reason</p>
          <p>{{ restrictionData.resolutionNote }}</p>
          <v-row
            ><v-col class="font-weight-bold">Date resolved</v-col
            ><v-col class="font-weight-bold">Resolved by</v-col></v-row
          >
          <v-row
            ><v-col>{{ restrictionData.updatedAt }}</v-col
            ><v-col>{{ restrictionData.updatedBy }}</v-col></v-row
          ></content-group
        ></template
      >
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primaryLabel="Resolve restriction"
              :secondaryLabel="restrictionData.isActive ? 'Cancel' : 'Close'"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
              :showPrimaryButton="restrictionData.isActive"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { PropType, ref, reactive } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";
import { Role, RestrictionType, VForm, RestrictionStatus } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";

export default {
  components: {
    ModalDialogBase,
    CheckPermissionRole,
    ErrorSummary,
    StatusChipRestriction,
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
    };
  },
};
</script>
