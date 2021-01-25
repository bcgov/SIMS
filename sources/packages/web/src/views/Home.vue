<template>
  <div>HOME</div>
</template>
<script lang="ts">
import { useRouter, onBeforeRouteUpdate,  } from "vue-router";
import { AppConfigService } from "../services/AppConfigService";
export default {
  setup() {
    const router = useRouter();
    console.log("Home");
    console.log(`${AppConfigService.shared.authService?.authenticated}`);

    // TODO: Check API for auth
    if (!AppConfigService.shared.authService?.authenticated) {
      console.log("Home: Redirecting to login");
      router.push({
        name: "Login"
      });
    } else {
      // TODO: Call API and check user exists or not
      router.push("UserAsFunc");
    }

    return {};
  }
};
</script>
