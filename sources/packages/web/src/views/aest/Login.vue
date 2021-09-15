<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="690px" outlined>
    <v-card-header>
      <v-card-header-text>
        <v-card-title class="my-6 bold-text" style="font-size: 27px;"
          >Welcome to AEST Portal</v-card-title
        >
        <v-card-subtitle>Welcome text goes here…</v-card-subtitle>
      </v-card-header-text>
    </v-card-header>
    <v-card-text
      >Please use your IDIR to authenticate. You must be previously authorized
      by the system administrator in order to successfully login.</v-card-text
    >
    <v-card-actions>
      <v-row justify="center" class="m-3">
        <v-btn color="primary" @click="login">
          <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
          Login with IDIR
        </v-btn>
      </v-row>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType } from "@/types";

export default {
  components: {},
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(AppIDPType.IDIR);
    };
    return { login };
  },
};
</script>
