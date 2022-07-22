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
      >Please use your IDIR to authenticate. You must be previously authorized
      by the system administrator in order to successfully login.
      <Message severity="error" v-if="showNotAllowedUser">
        The user was validated successfully but is not currently allowed to have
        access to this application. Please contact the Administrator for more
        information.
      </Message>
    </v-card-text>
    <v-card-actions>
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
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";

export default {
  components: {},
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
    return { login };
  },
};
</script>
