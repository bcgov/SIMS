<template>
  <v-form ref="addUserForm">
    <modal-dialog-base
      :showDialog="showDialog"
      @dialogClosed="dialogClosed"
      title="Add new user"
    >
      <template #content>
        <institution-user-management
          ref="institutionUserManagement"
          :errors="addUserForm.errors"
          :initialData="initialData"
        >
          <template #user-name="{ formModel }">
            <!-- Business BCeID  -->
            <v-autocomplete
              hide-details
              v-if="hasBusinessGuid && canSearchBCeIDUsers"
              v-model="formModel.selectedBCeIDUser"
              :items="bceidUsers"
              class="mr-3 bceid-input"
              density="compact"
              variant="outlined"
              label="Business BCeID user Id"
              :rules="[(v) => !!v || 'Business BCeID user Id is required.']"
            ></v-autocomplete>
            <!-- Basic BCeID  -->
            <v-text-field
              hide-details
              v-else
              v-model.trim="formModel.selectedBCeIDUser"
              class="mr-3 bceid-input"
              density="compact"
              variant="outlined"
              :label="userNameLabel"
              :rules="[(v) => !!v || 'BCeID user Id is required']"
            />
          </template>
        </institution-user-management>
      </template>
      <template #footer>
        <footer-buttons
          :processing="processing"
          primaryLabel="Add user now"
          @primaryClick="submit"
          @secondaryClick="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, watch, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormatters, useModalDialog, useSnackBar } from "@/composables";
import { InstitutionService } from "@/services/InstitutionService";
import { UserService } from "@/services/UserService";
import {
  ApiProcessError,
  BCeIDUser,
  LocationUserAccess,
  UserManagementModel,
  VForm,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";

import { InstitutionUserService } from "@/services/InstitutionUserService";

export default {
  components: { ModalDialogBase, InstitutionUserManagement },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
    hasBusinessGuid: {
      type: Boolean,
      required: true,
    },
    canSearchBCeIDUsers: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props: any) {
    const {
      showDialog,
      resolvePromise,
      showModal: showModalInternal,
    } = useModalDialog<boolean>();
    const toast = useSnackBar();
    const processing = ref(false);
    const addUserForm = ref({} as VForm);
    const institutionUserManagement = ref();
    const { getFormattedAddress } = useFormatters();
    const bceidUsers = ref([] as BCeIDUser[]);
    const initialData = ref(new UserManagementModel());

    /**
     * Load all institution locations.
     */
    const loadLocations = async () => {
      const locations =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.institutionId,
        );
      const locationAuthorizations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: getFormattedAddress(location.data.address),
        userAccess: LocationUserAccess.NoAccess,
      }));
      initialData.value = { locationAuthorizations } as UserManagementModel;
    };

    /**
     * Load all BCeID business users to allow the local search.
     * Only needed when the institution has a business guid associated with.
     */
    const loadBCeIDBusinessUsers = async () => {
      const bceidAccounts = await UserService.shared.getBCeIDAccounts();
      bceidUsers.value =
        bceidAccounts?.accounts.map((account) => ({
          value: account.userId,
          title: account.displayName,
        })) ?? ([] as BCeIDUser[]);
    };

    // Watch for changes on institutionId to reload the UI.
    watch(
      () => props.institutionId,
      async () => {
        await loadLocations();
        if (props.hasBusinessGuid && props.canSearchBCeIDUsers) {
          // Load BCeID users only for institutions that have a business guid.
          await loadBCeIDBusinessUsers();
        }
      },
      { immediate: true },
    );

    const showModal = async (): Promise<boolean> => {
      addUserForm.value.reset();
      addUserForm.value.resetValidation();
      return showModalInternal();
    };

    // Creates the user and closes the modal.
    const submit = async () => {
      const validationResult = await addUserForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const userManagementModel = institutionUserManagement.value
        .formModel as UserManagementModel;
      try {
        processing.value = true;
        await InstitutionUserService.shared.createInstitutionUserWithAuth(
          userManagementModel.selectedBCeIDUser,
          userManagementModel.isAdmin,
          userManagementModel.isLegalSigningAuthority,
          userManagementModel.locationAuthorizations,
          props.institutionId,
        );
        toast.success("User successfully created.");
        resolvePromise(true);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          addUserForm.value.errors.push({ errorMessages: [error.message] });
        } else {
          toast.error("An unexpected error happen while updating the user.");
        }
      } finally {
        processing.value = false;
      }
    };

    // Closed the modal dialog.
    const cancel = () => {
      resolvePromise(false);
    };

    const userNameLabel = computed(() => {
      return props.hasBusinessGuid
        ? "Business BCeID user ID"
        : "Basic BCeID user ID";
    });

    return {
      userNameLabel,
      addUserForm,
      showDialog,
      showModal,
      submit,
      cancel,
      processing,
      initialData,
      bceidUsers,
      institutionUserManagement,
    };
  },
};
</script>
<style scoped>
.bceid-input {
  /* Temporary fix for v-text-field/v-autocomplete. To be review in upcoming vuetify versions. */
  width: 300px;
}
</style>
