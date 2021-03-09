<template>
  <div>
    <NavBar />
    <router-view :key="$route.fullPath" />
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
  async created() {
    const router = this.$router;
    if (!AppConfigService.shared.authService?.authenticated) {
      router.push({
        name: StudentRoutesConst.LOGIN,
      });
    } else if (await UserService.shared.checkUser()) {
      /*After checking the user exists, information differences between BC Service card and SABC is synced
      And Redirect to Home page (Student's Dashboard)*/
      await StudentService.shared.synchronizeFromUserInfo();
      router.push({
        name: StudentRoutesConst.STUDENT_DASHBOARD,
      });
    } else {
      /* User doesn't exist in SABC Database and so redirect the user to Student Profile page
       where they can provide information and create SABC account */
      router.push({
        name: StudentRoutesConst.STUDENT_PROFILE,
      });
    }
  }
}
</script>
