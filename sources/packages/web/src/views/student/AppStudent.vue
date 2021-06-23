<template>
  <v-app-bar dense flat app>
    <v-img
      height="40px"
      alt="logo"
      src="../../assets/images/bc_student_logo.svg"
    />
    <v-spacer></v-spacer>
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
      >Applications</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
      >Notifications</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
      >Profile</v-btn
    >
    <v-btn v-if="isAuthenticated" text @click="logoff">Log off</v-btn>
  </v-app-bar>
  <router-view name="sidebar"></router-view>
  <v-main class="body-background">
    <v-container fluid>
      <router-view></router-view>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { onMounted, computed } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { UserService } from "../../services/UserService";
import { StudentService } from "../../services/StudentService";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { AppRoutes } from "../../types";

export default {
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );

    // Mounding hook
    onMounted(async () => {
      await AppConfigService.shared.initAuthService(ClientIdType.STUDENT);
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
          if (await UserService.shared.checkActiveUser()) {
            await StudentService.shared.synchronizeFromUserInfo();
            if (route.path === AppRoutes.StudentRoot) {
              // Loading student dash board if user try to load /student path
              router.push({
                name: StudentRoutesConst.STUDENT_DASHBOARD,
              });
            }
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

    const logoff = () => {
      AppConfigService.shared.logout(ClientIdType.STUDENT);
    };

    return {
      logoff,
      isAuthenticated,
      StudentRoutesConst,
    };
  },
};
</script>

<style lang="scss" scoped>
.body-background {
  background: #f2f2f2;
}
</style>
