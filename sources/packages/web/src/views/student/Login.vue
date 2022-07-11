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
    <v-card-actions>
      <v-row justify="center" class="m-3">
        <v-btn
          class="primary-btn-background"
          @click="login"
          prepend-icon="fa:fa fa-user"
        >
          Login / Sign up with BCSC
        </v-btn>
      </v-row>
    </v-card-actions>
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
