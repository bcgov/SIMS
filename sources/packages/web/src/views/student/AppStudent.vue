<template>
  <div>
    <NavBar />
    <router-view v-if="isAuthReady" :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted } from "vue";

import NavBar from "../../components/partial-view/student/NavBar.vue";
import { AppConfigService } from "../../services/AppConfigService";
import { UserService } from "../../services/UserService";
import { StudentService } from "../../services/StudentService";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";

export default {
  components: {
    NavBar,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isAuthReady = ref(false);

    // Mounding hook
    onMounted(async () => {
      await AppConfigService.shared.initAuthService(ClientIdType.STUDENT);
      isAuthReady.value = true;
      const auth = AppConfigService.shared.authService?.authenticated ?? false;
      if (!auth) {
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
            // Loading student dash board if user try to load /student path
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
    });
    return {
      isAuthReady,
    };
  },
};
</script>

<style lang="scss">
</style>