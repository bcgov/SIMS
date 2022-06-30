<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="690px" outlined>
    <v-card-header>
      <v-card-header-text>
        <v-card-title class="my-6 bold-text" style="font-size: 27px"
          >Welcome to StudentAid BC</v-card-title
        >
        <v-card-subtitle>Welcome text goes here…</v-card-subtitle>
      </v-card-header-text>
    </v-card-header>
    <v-card-text
      >We are using BCeID for Authentication. Please click on Login/Register
      buttons below to start your sign in/sign up with your Business BCeID.
      <Message severity="error" v-if="showBasicBCeIDMessage">
        No such Business account has been found with BCeID. Please login with
        your Business BCeId
      </Message>
      <Message severity="error" v-if="showDisabledUserMessage">
        Disabled User - you don't have access to the system. Please contact
        Administrator for more informations.
      </Message>
      <Message severity="error" v-if="showUnknownUserMessage">
        The user was validated successfully but is not currently allowed to have
        access to this application. Please contact the Administrator for more
        information
      </Message>
    </v-card-text>
    <v-card-actions>
      <v-row justify="center" class="my-3">
        <v-btn
          class="primary-btn-background"
          @click="login"
          prepend-icon="fa:fa fa-user"
        >
          Login with BCeID
        </v-btn>
        <v-btn
          class="primary-btn-background"
          @click="login"
          variant="outlined"
          prepend-icon="fa:fa fa-user-plus"
        >
          Sign Up with BCeID
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
    showBasicBCeIDMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
    showDisabledUserMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
    showUnknownUserMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.Institution, AppIDPType.BCeID);
    };
    return { login };
  },
};
</script>
