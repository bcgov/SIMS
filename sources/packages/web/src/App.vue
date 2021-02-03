<template>
  <div>
    <Toast />
    <NavBar />
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NavBar from "./components/NavBar.vue";
import { AppConfigService } from "./services/AppConfigService";
import { UserService } from "./services/UserService";

@Options({
  components: {
    NavBar
  }
})
export default class App extends Vue {
  async created() {
    const router = this.$router;

    // TODO: Check API for auth
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: "Login"
      });
    } else if (await UserService.shared.checkUser()) {
      //User exists and so redirect to Home page (Student's Dashboard)
      router.push({
        name: "Home"
      });
    } else {
      // User doesnt exist in SABC Database and so redirect the user to Student Profile page
      // where they can provide information and create SABC account
      router.push({
        name: "Student-Profile"
      });
    }
  }
}
</script>
