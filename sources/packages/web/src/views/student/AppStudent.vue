<template>
  <!-- Adding overflow:visible to allow the use of the Prime Vue
  floating menu while Veutify component is not ready.  -->
  <v-app-bar dense flat app style="overflow:visible">
    <v-img
      class="ml-5"
      max-width="311px"
      height="40px"
      alt="logo"
      src="../../assets/images/bc_student_logo.svg"
      @click="logoClick"
    />
    <v-spacer></v-spacer
    ><v-btn
      v-if="isAuthenticated"
      text
      @click="
        $router.push({ name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY })
      "
      >ApplicationS</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.NOTIFICATIONS })"
      >Notifications</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
      >Profile</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      class="mr-5"
      icon="mdi-account"
      outlined
      elevation="1"
      color="grey"
      @click="togleUserMenu"
    ></v-btn>
    <Menu
      v-if="isAuthenticated"
      ref="userOptionsMenuRef"
      :model="userMenuItems"
      :popup="true"
    />
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
import { onMounted, ref } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { UserService } from "../../services/UserService";
import { StudentService } from "../../services/StudentService";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { AppRoutes } from "../../types";
import { useAuth } from "@/composables";

export default {
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();

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

    const logoClick = () => {
      const routeName = isAuthenticated.value
        ? StudentRoutesConst.STUDENT_DASHBOARD
        : StudentRoutesConst.LOGIN;
      router.push({
        name: routeName,
      });
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Notifications Settings",
        icon: "pi pi-bell",
        command: () => {
          router.push({
            name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
          });
        },
      },
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: () => {
          AppConfigService.shared.logout(ClientIdType.STUDENT);
        },
      },
    ];

    return {
      logoClick,
      userMenuItems,
      isAuthenticated,
      StudentRoutesConst,
      userOptionsMenuRef,
      togleUserMenu,
    };
  },
};
</script>

<style lang="scss" scoped>
.body-background {
  background: #f2f2f2;
}
</style>
