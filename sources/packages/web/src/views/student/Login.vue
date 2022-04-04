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
      >We are using BCSC for authentication. Please click on Login/Register
      buttons below to start your sign in/sign up.</v-card-text
    >
    <v-row justify="center" class="m-3">
      <v-btn class="mr-2" color="primary" @click="login">
        <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
        Login with BCSC
      </v-btn>
      <v-btn color="primary" @click="login">
        <v-icon size="25" class="mr-2">mdi-account-star-outline</v-icon>
        Sign Up with BCSC
      </v-btn>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";

export default {
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.Student, AppIDPType.BCSC);
    };
    return { login };
  },
};
</script>
