<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="690px" outlined>
    <v-card-header>
      <v-card-header-text>
        <v-card-title class="my-6 bold-text" style="font-size: 27px;"
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
        <v-btn justify-center color="primary" @click="login">
          <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
          Login with BCSC
        </v-btn>
        <v-btn color="primary" @click="login">
          <v-icon size="25" class="mr-2">mdi-account-star-outline</v-icon>
          Sign Up with BCSC
        </v-btn>
      </v-row>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { AppConfigService } from "../../services/AppConfigService";

@Options({
  components: {},
})
export default class Login extends Vue {
  login() {
    AppConfigService.shared.authService?.login({
      idpHint: "bcsc",
    });
  }
}
</script>
