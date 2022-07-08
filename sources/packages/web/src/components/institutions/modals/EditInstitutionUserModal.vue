<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Edit user"
  >
    <template #content>
      <institution-user-management
        ref="institutionUserManagement"
        :initialData="initialData"
      >
        <template #user-name>
          <v-text-field
            v-model="userInfo.displayName"
            disabled
            class="mr-3 bceid-input"
            density="compact"
            variant="outlined"
            label="BCeID user ID"
            :rules="[(v) => !!v || 'Basic BCeID user Id is required']"
          />
        </template>
      </institution-user-management>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Edit user now"
        @primaryClick="submit"
        @secondaryClick="cancel"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { ref, watch, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormatters, useModalDialog } from "@/composables";
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
  InstitutionUserViewModel,
  LocationUserAccess,
  UserManagementModel,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";
import { InstitutionUserAPIOutDTO } from "@/services/http/dto";

export default {
  components: { ModalDialogBase, InstitutionUserManagement },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const {
      showDialog,
      resolvePromise,
      showModal,
      showParameter: user,
    } = useModalDialog<boolean, InstitutionUserViewModel>();
    const institutionUserManagement = ref();
    const { getFormattedAddress } = useFormatters();
    const initialData = ref(new UserManagementModel());

    // Information of the user being edited received through the modal show dialog.
    const userInfo = computed(() => {
      return user.value ?? ({} as InstitutionUserViewModel);
    });

    const getLocationAccess = (
      locationId: number,
      userDetails: InstitutionUserAPIOutDTO,
    ): LocationUserAccess => {
      const locationAuthorization = userDetails.authorizations.find(
        (authorization) => authorization.location?.id === locationId,
      );
      return locationAuthorization?.authType.type === LocationUserAccess.User
        ? LocationUserAccess.User
        : LocationUserAccess.NoAccess;
    };

    watch(userInfo, async () => {
      // Get the user permissions.
      const userDetails =
        await InstitutionService.shared.getInstitutionLocationUserDetails(
          userInfo.value.userName,
        );
      // A user is considered an admin if any authorization has a userType defined as admin.
      const isAdmin = userDetails.authorizations.some(
        (authorization) =>
          authorization.authType.type === InstitutionUserTypes.admin,
      );
      // A user is considered a legal signing authority if any rule is defined as legal-signing-authority.
      const isLegalSigningAuthority = userDetails.authorizations.some(
        (authorization) =>
          authorization.authType.role ===
          InstitutionUserRoles.legalSigningAuthority,
      );
      // Load locations list with permissions.
      const locations =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.institutionId,
        );
      // Reset the array.

      const locationAuthorizations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: getFormattedAddress(location.data.address),
        userAccess: getLocationAccess(location.id, userDetails),
      }));

      initialData.value = {
        isAdmin,
        isLegalSigningAuthority,
        locationAuthorizations,
      } as UserManagementModel;
    });

    // Update the user and closes the modal.
    const submit = async () => {
      const formValidation =
        await institutionUserManagement.value.userForm.validate();
      if (!formValidation.valid) {
        return;
      }
      const userManagementModel = institutionUserManagement.value
        .formModel as UserManagementModel;
      await InstitutionService.shared.updateInstitutionUserWithAuth(
        userInfo.value.userName,
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
      userInfo,
      institutionUserManagement,
      initialData,
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
