<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Add new user"
  >
    <template #content>
      <institution-user-management
        :locationsAccess="locationsAccess"
        ref="institutionUserManagement"
      >
        <template #user-name>
          <!-- Business BCeID  -->
          <v-autocomplete
            v-if="hasBusinessGuid"
            v-model="selectedBCeIDUser"
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
            v-model="selectedBCeIDUser"
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
  CreateInstitutionUserAPIInDTO,
  UserPermissionAPIInDTO,
} from "@/services/http/dto";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
  LocationAuthorization,
  LocationUserAccess,
} from "@/types";
import InstitutionUserManagement from "@/components/institutions/modals/InstitutionUserManagement.vue";

interface BCeIDUser {
  value: string;
  title: string;
}

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
    const isAdmin = ref(false);
    const hasBusinessGuid = ref(false);
    const legalSigningAuthority = ref<string | undefined>();
    const locationsAccess = reactive([] as LocationAuthorization[]);
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
      const locationAuthorizations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: getFormattedAddress(location.data.address),
        userAccess: LocationUserAccess.NoAccess,
      }));
      locationsAccess.push(...locationAuthorizations);
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
      props.institutionId,
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
      const createUserPayload = {} as CreateInstitutionUserAPIInDTO;
      createUserPayload.userId = selectedBCeIDUser.value;
      if (isAdmin.value) {
        // User is an admin and will have access for all the locations.
        createUserPayload.permissions = [
          {
            userType: InstitutionUserTypes.admin,
            userRole: legalSigningAuthority.value
              ? InstitutionUserRoles.legalSigningAuthority
              : undefined,
          } as UserPermissionAPIInDTO,
        ];
      } else {
        // User is not an admin and will have the permission assigned to the individual locations.
        // Filter locations with access. At this point the UI validations already ensured
        // that there will be at least one location defined with some access level.
        createUserPayload.permissions = locationsAccess
          .filter(
            (locationAccess) =>
              locationAccess.userAccess === LocationUserAccess.User,
          )
          .map(
            (locationAccess) =>
              ({
                locationId: locationAccess.id,
                userType: locationAccess.userAccess,
              } as UserPermissionAPIInDTO),
          );
      }
      await InstitutionService.shared.createInstitutionUserWithAuth(
        createUserPayload,
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
      locationsAccess,
      isAdmin,
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
