<template>
  <!-- Add user -->
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    title="Add new user"
  >
    <template #content
      ><content-group>
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
          ></v-autocomplete>
          <v-switch label="Admin" color="primary" inset class="mr-3"></v-switch>
          <v-switch
            label="Legal signing authority"
            inset
            color="primary"
          ></v-switch>
        </v-row>
      </content-group>
      <h3 class="category-header-medium primary-color my-2">
        Assign user to locations
      </h3>
      <content-group>
        <span>
          <v-row
            ><v-col><strong>Locations</strong> </v-col
            ><v-col>
              <strong>User Type</strong>
            </v-col>
          </v-row>
          <v-row v-for="location in locationsAccess" :key="location.id"
            ><v-col>
              <div>{{ location.name }}</div>
              {{ location.address }}
            </v-col>
            <v-col>
              <v-radio-group inline v-model="location.userAccess">
                <v-radio label="User" value="user"></v-radio>
                <v-radio label="No access" value="none"></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </span>
      </content-group>
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
    locationId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const { getFormattedAddress } = useFormatters();
    const isAdmin = ref(false);
    const isLegalSigningAuthority = ref(false);
    const locationsAccess = reactive([] as LocationAuthorization[]);
    const bceidUsers = ref([] as BCeIDUser[]);
    const selectedBCeIDUser = ref("");

    const loadLocations = async () => {
      const locations =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.locationId,
        );
      const locationAuthorizations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: getFormattedAddress(location.data.address),
        userAccess: LocationUserAccess.NoAccess,
      }));
      locationsAccess.push(...locationAuthorizations);
    };

    const loadBCeIDBusinessUsers = async () => {
      const bceidAccounts = await UserService.shared.getBCeIDAccounts();
      bceidUsers.value =
        bceidAccounts?.accounts.map((account) => ({
          value: account.guid,
          title: account.displayName,
        })) ?? ([] as BCeIDUser[]);
    };

    watch(
      props.locationId,
      async () =>
        await Promise.all([loadLocations(), loadBCeIDBusinessUsers()]),
      { immediate: true },
    );

    const submit = () => {
      resolvePromise(true);
    };

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
      isLegalSigningAuthority,
      bceidUsers,
      selectedBCeIDUser,
    };
  },
};
</script>
