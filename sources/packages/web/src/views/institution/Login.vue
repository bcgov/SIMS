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
          buttons below to start your sign in/sign up with your Business BCeID.
        </h4>
      </div>

      <Message severity="error" v-if="basicBCeID">
        No such Business account has been found with BCeID. Please login with
        your Business BCeId
      </Message>
    </template>

    <template #footer>
      <Button
        label="Login with Business BCeID"
        icon="pi pi-check"
        class="p-mr-2"
        @click="login"
      ></Button>
      <Button
        label="Sign Up for Business BCeID"
        icon="pi pi-user"
        class="p-button-info"
        @click="login"
      ></Button>
    </template>
  </Card>
</template>

<script lang="ts">
import { AppConfigService } from "../../services/AppConfigService";
import { onMounted } from "vue";

export default {
  components: {},
  props: {
    basicBCeID: {
      type: Boolean,
      default: false,
    },
  },

  setup(props: any) {
    onMounted(async () => {
      // if (props.basicBCeID) {
      //   //logging off so that refreshes to this page log off users
      //   await AppConfigService.shared.authService?.logout();
      // }
    });
    const login = () => {
      AppConfigService.shared.authService?.login({
        idpHint: "bceid",
      });
    };

    return { login };
  },
};
</script>
