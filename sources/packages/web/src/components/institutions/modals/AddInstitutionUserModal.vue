<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Add new user"
  >
    <template #content>
      <institution-user-management
        :initialData="initialData"
        ref="institutionUserManagement"
      >
        <template #user-name="{ formModel }">
          <!-- Business BCeID  -->
          <v-autocomplete
            v-if="hasBusinessGuid"
            v-model="formModel.selectedBCeIDUser"
            :items="bceidUsers"
            class="mr-3 bceid-input"
            density="compact"
            variant="outlined"
            label="Business BCeID user Id"
            :rules="[(v) => !!v || 'Business BCeID user Id is required']"
          ></v-autocomplete>
          <!-- Basic BCeID  -->
          <v-text-field
            v-else
            v-model.trim="formModel.selectedBCeIDUser"
            class="mr-3 bceid-input"
            density="compact"
            variant="outlined"
            label="Basic BCeID user ID"
            :rules="[(v) => !!v || 'Basic BCeID user Id is required']"
          />
        </template>
      </institution-user-management>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Add user now"
        @primaryClick="submit"
        @secondaryClick="cancel"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormatters, useModalDialog, useToastMessage } from "@/composables";
import { InstitutionService } from "@/services/InstitutionService";
import { UserService } from "@/services/UserService";
import {
  BCeIDUser,
  LocationUserAccess,
  UserManagementModel,
  VForm,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";

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
  },
  setup(props: any) {
    const toast = useToastMessage();
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
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
        if (props.hasBusinessGuid) {
          // Load BCeID users only for institutions that have a business guid.
          await loadBCeIDBusinessUsers();
        }
      },
      { immediate: true },
    );

    // Creates the user and closes the modal.
    const submit = async () => {
      const form = institutionUserManagement.value.userForm as VForm;
      const validationResult = await form.validate();
      if (!validationResult.valid) {
        return;
      }
      const userManagementModel = institutionUserManagement.value
        .formModel as UserManagementModel;
      try {
        await InstitutionService.shared.createInstitutionUserWithAuth(
          userManagementModel.selectedBCeIDUser as string,
          userManagementModel.isAdmin,
          userManagementModel.isLegalSigningAuthority,
          userManagementModel.locationAuthorizations,
        );
        toast.success("User created", "User successfully created.");
        resolvePromise(true);
      } catch {
        toast.error(
          "Unexpected error",
          "An error happened while creating the user.",
        );
      }
    };

    // Closed the modal dialog.
    const cancel = () => {
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      submit,
      cancel,
      initialData,
      bceidUsers,
      institutionUserManagement,
    };
  },
};
</script>
<style scoped>
.bceid-input {
  width: 300px;
}
</style>
