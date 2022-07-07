<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Add new user"
  >
    <template #content>
      <institution-user-management
        :locationAuthorizations="locationAuthorizations"
        ref="institutionUserManagement"
      >
        <template #user-name="{ formModel }">
          <!-- Business BCeID  -->
          <v-autocomplete
            v-if="hasBusinessGuid"
            v-model="formModel.selectedBCeIDUser"
            :items="bceidUsers"
            style="min-width: 300px"
            class="mr-3"
            density="compact"
            variant="outlined"
            label="Business BCeID user Id"
            :rules="[(v) => !!v || 'Business BCeID user Id is required']"
          ></v-autocomplete>
          <!-- Basic BCeID  -->
          <v-text-field
            v-else
            v-model.trim="formModel.selectedBCeIDUser"
            style="min-width: 300px"
            class="mr-3"
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
import { ref, reactive, watch } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormatters, useModalDialog } from "@/composables";
import { InstitutionService } from "@/services/InstitutionService";
import { UserService } from "@/services/UserService";
import {
  BCeIDUser,
  InstitutionUserRoles,
  LocationAuthorization,
  LocationUserAccess,
  UserManagementModel,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";

export default {
  components: { ModalDialogBase, InstitutionUserManagement },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const institutionUserManagement = ref();
    const { getFormattedAddress } = useFormatters();
    const hasBusinessGuid = ref(false);
    const legalSigningAuthority = ref<string | undefined>();
    const locationAuthorizations = reactive([] as LocationAuthorization[]);
    const bceidUsers = ref([] as BCeIDUser[]);
    const selectedBCeIDUser = ref("");

    /**
     * Load all institution locations.
     */
    const loadLocations = async () => {
      const locations =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.institutionId,
        );
      const authorizations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: getFormattedAddress(location.data.address),
        userAccess: LocationUserAccess.NoAccess,
      }));
      locationAuthorizations.push(...authorizations);
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

    /**
     * Set the type of the institution as basic/business BCeID.
     */
    const setHasBusinessGuid = async () => {
      const institutionDetails = await InstitutionService.shared.getDetail(
        props.institutionId,
      );
      hasBusinessGuid.value = institutionDetails.hasBusinessGuid;
    };

    // Watch for changes on institutionId to reload the UI.
    watch(
      () => props.institutionId,
      async () => {
        await Promise.all([loadLocations(), setHasBusinessGuid()]);
        if (hasBusinessGuid.value) {
          // Load BCeID users only for institutions that have a business guid.
          await loadBCeIDBusinessUsers();
        }
      },
      { immediate: true },
    );

    // Creates the user and closes the modal.
    const submit = async () => {
      const formValidation =
        await institutionUserManagement.value.userForm.validate();
      if (!formValidation.valid) {
        return;
      }
      const userManagementModel = institutionUserManagement.value
        .formModel as UserManagementModel;
      await InstitutionService.shared.createInstitutionUserWithAuth(
        userManagementModel.selectedBCeIDUser,
        userManagementModel.isAdmin,
        userManagementModel.isLegalSigningAuthority,
        userManagementModel.locationAuthorizations,
      );
      resolvePromise(true);
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
      locationAuthorizations,
      legalSigningAuthority,
      bceidUsers,
      selectedBCeIDUser,
      InstitutionUserRoles,
      hasBusinessGuid,
      institutionUserManagement,
    };
  },
};
</script>
