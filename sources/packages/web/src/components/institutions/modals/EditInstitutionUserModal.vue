<template>
  <v-form ref="editUserForm">
    <modal-dialog-base
      :showDialog="showDialog"
      @dialogClosed="dialogClosed"
      title="Edit user"
      data-cy="editUserModal"
    >
      <template #content>
        <institution-user-management
          ref="institutionUserManagement"
          :errors="editUserForm.errors"
          :initialData="initialData"
        >
          <template #user-name>
            <v-text-field
              hide-details="auto"
              v-model="userInfo.displayName"
              disabled
              class="mr-3 bceid-input"
              density="compact"
              variant="outlined"
              :label="userNameLabel"
              :rules="[(v) => !!v || 'Basic BCeID user Id is required.']"
            />
          </template>
        </institution-user-management>
      </template>
      <template #footer>
        <check-permission-role :role="Role.InstitutionEditUser">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primaryLabel="Edit user now"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useFormatters, useModalDialog, useSnackBar } from "@/composables";
import { InstitutionService } from "@/services/InstitutionService";
import {
  ApiProcessError,
  InstitutionUserRoles,
  InstitutionUserTypes,
  InstitutionUserViewModel,
  LocationUserAccess,
  UserManagementModel,
  VForm,
  Role,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";
import { InstitutionUserAPIOutDTO } from "@/services/http/dto";
import {
  BCEID_ACCOUNT_NOT_FOUND,
  INSTITUTION_MUST_HAVE_AN_ADMIN,
  INSTITUTION_USER_ALREADY_EXISTS,
  LEGAL_SIGNING_AUTHORITY_EXIST,
} from "@/constants";
import { InstitutionUserService } from "@/services/InstitutionUserService";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

const submitKnownErrors = [
  INSTITUTION_USER_ALREADY_EXISTS,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  INSTITUTION_MUST_HAVE_AN_ADMIN,
  BCEID_ACCOUNT_NOT_FOUND,
];

export default defineComponent({
  components: {
    ModalDialogBase,
    InstitutionUserManagement,
    CheckPermissionRole,
  },
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
  setup(props) {
    const {
      showDialog,
      resolvePromise,
      showModal: showModalInternal,
    } = useModalDialog<boolean, InstitutionUserViewModel>();
    const processing = ref(false);
    const editUserForm = ref({} as VForm);
    const snackBar = useSnackBar();
    const institutionUserManagement = ref();
    const { getFormattedAddress } = useFormatters();
    const initialData = ref(new UserManagementModel());
    // Information of the user being edited received through the modal show dialog.
    const userInfo = ref({} as InstitutionUserViewModel);

    // Define if the location has user access.
    const getLocationAccess = (
      locationId: number,
      userDetails: InstitutionUserAPIOutDTO,
    ): LocationUserAccess => {
      const locationAuthorization = userDetails.authorizations.find(
        (authorization) => authorization.location?.id === locationId,
      );
      if (locationAuthorization?.authType.type === LocationUserAccess.User) {
        return LocationUserAccess.User;
      } else if (
        locationAuthorization?.authType.type === LocationUserAccess.ReadOnlyUser
      ) {
        return LocationUserAccess.ReadOnlyUser;
      } else {
        return LocationUserAccess.NoAccess;
      }
    };

    // Show the modal and loads the user information.
    const showModal = async (
      params: InstitutionUserViewModel,
    ): Promise<boolean> => {
      editUserForm.value.reset();
      editUserForm.value.resetValidation();
      userInfo.value = params;
      // Get the user permissions.
      const userDetails =
        await InstitutionUserService.shared.getInstitutionUserById(
          userInfo.value.institutionUserId,
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
      // Call the modal method to show the modal.
      return showModalInternal(params);
    };

    // Update the user and closes the modal.
    const submit = async () => {
      const formValidation = await editUserForm.value.validate();
      if (!formValidation.valid) {
        return;
      }
      try {
        processing.value = true;
        const userManagementModel = institutionUserManagement.value
          .formModel as UserManagementModel;
        await InstitutionUserService.shared.updateInstitutionUserWithAuth(
          userInfo.value.institutionUserId,
          userManagementModel.isAdmin,
          userManagementModel.isLegalSigningAuthority,
          userManagementModel.locationAuthorizations,
        );
        resolvePromise(true);
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          submitKnownErrors.includes(error.errorType)
        ) {
          editUserForm.value.errors.push({ errorMessages: [error.message] });
        } else {
          snackBar.error("An unexpected error happen while updating the user.");
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
      editUserForm,
      userNameLabel,
      showDialog,
      showModal,
      submit,
      cancel,
      processing,
      userInfo,
      institutionUserManagement,
      initialData,
      Role,
    };
  },
});
</script>
<style scoped>
.bceid-input {
  /* Temporary fix for v-text-field/v-autocomplete. To be review in upcoming vuetify versions. */
  width: 300px;
}
</style>
