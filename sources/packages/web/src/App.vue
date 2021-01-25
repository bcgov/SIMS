<template>
  <div>
    <NavBar />
    <router-view />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NavBar from "./components/NavBar.vue";
import { AppConfigService } from "./services/AppConfigService";

@Options({
  components: {
    NavBar
  },
})
export default class App extends Vue {
  async created() {
    const router = this.$router;
    // TODO: Check API for auth
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: "Login"
      });
    } else {
      // TODO: Call API and check user exists or not
      router.push("UserAsFunc");
    }
  }
}
</script>
