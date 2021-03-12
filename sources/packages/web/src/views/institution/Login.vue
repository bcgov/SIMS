<template>
  <Card class="p-m-4">
    <template #title>
      Institutional Login
    </template>
    <template #content>
      <div>
        <h1>Welcome to StudentAid BC</h1>
        <h4>
          We are using BCeID for Authentication. Please click on Login/Register
          buttons below to start your sign in/sign up.
        </h4>
      </div>
    </template>
    <template #footer>
      <Button
        label="Login with BCeID"
        icon="pi pi-check"
        class="p-mr-2"
        @click="login"
      ></Button>
      <Button
        label="Sign Up with BCeID"
        icon="pi pi-user"
        class="p-button-info"
        @click="login"
      ></Button>
    </template>
  </Card>
</template>

<script lang="ts">
import { AppConfigService } from "../../services/AppConfigService";

export default {
  components: {},
  setup() {
    const login = () => {
      AppConfigService.shared.authService?.login({
        idpHint: "bceid",
      });
    };

    return { login };
  },
};
</script>
