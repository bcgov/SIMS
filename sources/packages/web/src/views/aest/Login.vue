<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="690px" outlined>
    <v-card-header>
      <v-card-header-text>
        <v-card-title class="my-6 bold-text" style="font-size: 27px"
          >Welcome to AEST Portal</v-card-title
        >
        <v-card-subtitle>Welcome text goes here…</v-card-subtitle>
      </v-card-header-text>
    </v-card-header>
    <v-card-text
      ><div>
        Please use your IDIR to authenticate. You must be previously authorized
        by the system administrator in order to successfully login.
      </div>
      <banner
        class="mt-2"
        :type="BannerTypes.Error"
        v-if="showNotAllowedUser"
        summary="The user was validated successfully but is not currently allowed to
        have access to this application. Please contact the Administrator for
        more information."
      />
      <!-- TODO: v-btn inside v-card-actions is not working properly. try in vuetify 3 stable version -->
      <div class="pt-6 pb-2">
        <v-row justify="center">
          <v-btn
            color="primary"
            data-cy="loginWithIDIR"
            @click="login"
            prepend-icon="fa:fa fa-user"
          >
            Login with IDIR
          </v-btn>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";
import { BannerTypes } from "@/types/contracts/Banner";

export default {
  props: {
    showNotAllowedUser: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.AEST, AppIDPType.IDIR);
    };
    return { login, BannerTypes };
  },
};
</script>
