<template>
  <Card class="p-m-4">
    <template #title>
      Login
    </template>
    <template #content>
      <div>
        <h1>Welcome to Student Aid Portal</h1>
        <h4>
          We are using BCSC for authentication. Please click on login button
          below to start your sign up/sign in.
        </h4>
      </div>
    </template>
    <template #footer>
      <Button
        label="Login"
        icon="pi pi-check"
        @click="login"
      ></Button>
      <Button
        label="Register"
        icon="pi pi-user"
        class="p-button-info"
        @click="login"
      ></Button>
    </template>
  </Card>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { AppConfigService } from "../services/AppConfigService";

@Options({
  components: {}
})
export default class Login extends Vue {
  login() {
    AppConfigService.shared.authService?.login({
      idpHint: "bcsc",
      redirectUri: `${location.origin}/`
    });
  }
}
</script>
