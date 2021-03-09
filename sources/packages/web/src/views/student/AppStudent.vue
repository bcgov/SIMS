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
import { ClientIdType } from "@/types/contracts/ConfigContract";

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
    await AppConfigService.shared.initAuthService(ClientIdType.STUDENT);
    this.isAuthReady = true;
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: StudentRoutesConst.LOGIN,
      });
    } else {
      // TODO:
      // - Try to implement a role based processing
      // Get path
      if (await UserService.shared.checkUser()) {
        await StudentService.shared.synchronizeFromUserInfo();
        if (route.path === "/student") {
          router.push({
            name: StudentRoutesConst.STUDENT_DASHBOARD,
          });
        }
      } else {
        /* User doesn't exist in SABC Database and so redirect the user to Student Profile page
       where they can provide information and create SABC account */
        router.push({
          name: StudentRoutesConst.STUDENT_PROFILE,
        });
      }
    }
  }
}
</script>
