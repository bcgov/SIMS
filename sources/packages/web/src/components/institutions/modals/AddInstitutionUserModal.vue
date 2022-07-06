<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Add new user"
  >
    <template #content>
      <v-form ref="addNewUserForm">
        <content-group>
          <v-row align="center" class="mx-1">
            <!-- <v-text-field
            style="min-width: 300px"
            class="mr-3"
            density="compact"
            variant="outlined"
            label="Basic BCeID user ID"
          /> -->
            <v-autocomplete
              v-model="selectedBCeIDUser"
              :items="bceidUsers"
              style="min-width: 300px"
              class="mr-3"
              density="compact"
              variant="outlined"
              label="Business BCeID user Id"
              :rules="[(v) => !!v || 'User is required']"
            ></v-autocomplete>
            <v-switch
              label="Admin"
              color="primary"
              inset
              class="mr-3"
              :false-value="null"
              true-value="admin"
              v-model="isAdmin"
            ></v-switch>
            <v-switch
              :disabled="!isAdmin"
              label="Legal signing authority"
              inset
              color="primary"
              v-model="legalSigningAuthority"
            ></v-switch>
          </v-row>
        </content-group>
        <h3 class="category-header-medium primary-color my-2" v-if="!isAdmin">
          Assign user to locations
        </h3>
        <content-group v-if="!isAdmin">
          <span>
            <v-row
              ><v-col><strong>Locations</strong> </v-col
              ><v-col>
                <strong>Roles</strong>
              </v-col>
            </v-row>
            <v-row v-for="location in locationsAccess" :key="location.id"
              ><v-col>
                <div>{{ location.name }}</div>
                {{ location.address }}
              </v-col>
              <v-col>
                <v-radio-group
                  inline
                  v-model="location.userAccess"
                  color="primary"
                >
                  <v-radio label="User" value="user" color="primary"></v-radio>
                  <v-radio
                    label="No access"
                    value="none"
                    color="primary"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </span>
          <v-input :rules="[hasLocationAccessValidationRule()]" error>
          </v-input>
        </content-group>
      </v-form>
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
import { InstitutionUserRoles, InstitutionUserTypes } from "@/types";

enum LocationUserAccess {
  User = "user",
  NoAccess = "none",
}

interface LocationAuthorization {
  id: number;
  name: string;
  address: string;
  userAccess: LocationUserAccess;
}

interface BCeIDUser {
  value: string;
  title: string;
}

export default {
  components: { ModalDialogBase },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const { getFormattedAddress } = useFormatters();
    const addNewUserForm = ref({} as { validate: () => Promise<any> });
    const isAdmin = ref(false);
    const legalSigningAuthority = ref<string | undefined>();
    const locationsAccess = reactive([] as LocationAuthorization[]);
    const bceidUsers = ref([] as BCeIDUser[]);
    const selectedBCeIDUser = ref("");
    // Load locations list.
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
    // Load all BCeID business users.
    const loadBCeIDBusinessUsers = async () => {
      const bceidAccounts = await UserService.shared.getBCeIDAccounts();
      bceidUsers.value =
        bceidAccounts?.accounts.map((account) => ({
          value: account.userId,
          title: account.displayName,
        })) ?? ([] as BCeIDUser[]);
    };

    watch(
      props.institutionId,
      async () =>
        await Promise.all([loadLocations(), loadBCeIDBusinessUsers()]),
      { immediate: true },
    );

    watch(isAdmin, () => {
      if (!isAdmin.value) {
        legalSigningAuthority.value = undefined;
      }
    });

    const submit = async () => {
      const formValidation = await addNewUserForm.value.validate();
      if (!formValidation.valid) {
        return;
      }

      const createUserPayload = {} as CreateInstitutionUserAPIInDTO;
      createUserPayload.userId = selectedBCeIDUser.value;

      if (isAdmin.value) {
        // User is an admin and will have for all the locations.
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

    const cancel = () => {
      resolvePromise(false);
    };

    const hasLocationAccessValidationRule = () => {
      if (isAdmin.value) {
        return true;
      }
      const hasSomeLocationAccess = locationsAccess.some(
        (locationAccess) =>
          locationAccess.userAccess === LocationUserAccess.User,
      );
      if (!hasSomeLocationAccess) {
        return "Select at least one location for non-admin users.";
      }

      return true;
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
      addNewUserForm,
      hasLocationAccessValidationRule,
      InstitutionUserRoles,
    };
  },
};
</script>
