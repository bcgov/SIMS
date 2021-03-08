<template>
  <div>
    <NavBar />
    <router-view v-if="isAuthReady" :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NavBar from "../../components/partial-view/student/NavBar.vue";
import { AppConfigService } from "../../services/AppConfigService";
import { UserService } from "../../services/UserService";
import { StudentService } from "../../services/StudentService";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";

@Options({
  components: {
    NavBar,
  },
})
export default class AppStudent extends Vue {
  // Flag to hold whole student app children mounding
  isAuthReady = false;
  async created() {
    const router = this.$router;
    const route = this.$route;
    await AppConfigService.shared.initAuthService("student");
    this.isAuthReady = true;
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: StudentRoutesConst.LOGIN,
      });
    } else {
      // TODO:
      // - Try to implement a role based processing
      // Get path
      const path = route.path;
      console.log("Not ok if called before KC");
      if (path.includes("/student")) {
        if (await UserService.shared.checkUser()) {
          if (path.includes("/student")) {
            await StudentService.shared.synchronizeFromUserInfo();

            // Not allowing to load login page
            if (path.includes("login")) {
              router.push({
                name: "StudentDashboard",
              });
            }
          }
        } else {
          /* User doesn't exist in SABC Database and so redirect the user to Student Profile page
       where they can provide information and create SABC account */
          router.push({
            name: "Student-Profile",
          });
        }
      }
    }
  }
}
</script>
