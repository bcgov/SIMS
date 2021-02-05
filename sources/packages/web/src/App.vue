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
    NavBar,
  },
})
export default class App extends Vue {
  async created() {
    const router = this.$router;
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: "Login",
      });
    } else if (
      (await UserService.shared.checkUser()) &&
      (await UserService.shared.synchronizeUserInfo())
    ) {
      /*After checking the user exists, information differences between BC Service card and SABC is synced
      And Redirect to Home page (Student's Dashboard)*/
      router.push({
        name: "Home",
      });
    } else {
      /* User doesn't exist in SABC Database and so redirect the user to Student Profile page
       where they can provide information and create SABC account */
      router.push({
        name: "Student-Profile",
      });
    }
  }
}
</script>
