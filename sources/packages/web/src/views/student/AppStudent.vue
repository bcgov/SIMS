<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <!-- Adding overflow:visible to allow the use of the Prime Vue
  floating menu while Veutify component is not ready.  -->
    <v-app-bar dense flat app style="overflow:visible">
      <BCLogo subtitle="Student Application" @click="logoClick"></BCLogo>
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
    <ConfirmExtendTime
      ref="extendTimeModal"
      :startTimer="startTimer"
      :clientIdType="ClientIdType.Student"
    />
  </div>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { onMounted, ref, onUnmounted } from "vue";
import { UserService } from "@/services/UserService";
import { StudentService } from "@/services/StudentService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { AppRoutes, ClientIdType } from "@/types";
import { useAuth, ModalDialog } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import { MINIMUM_IDLE_TIME_FOR_WARNING_STUDENT } from "@/constants/system-constants";
import ConfirmExtendTime from "@/components/common/modals/ConfirmExtendTime.vue";

export default {
  components: { BCLogo, ConfirmExtendTime },
  setup() {
    const { executeLogout, executeRenewTokenIfExpired } = useAuth();
    const router = useRouter();
    const route = useRoute();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();
    const lastActivityLogin = ref(new Date() as Date);
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);
    const startTimer = ref(false);

    const startIdleCheckerTimer = () => {
      if (!route.path.includes(AppRoutes.Login)) {
        /* eslint-disable */
        interval.value = setInterval(checkIdle, 30000);
        /*eslint-enable */
      }
    };

    const confirmExtendTimeModal = async () => {
      if (await extendTimeModal.value.showModal()) {
        lastActivityLogin.value = new Date();
        startTimer.value = false;
        clearInterval(interval.value);
        startIdleCheckerTimer();
        executeRenewTokenIfExpired();
      }
    };

    const checkIdle = () => {
      const diff = new Date().getTime() - lastActivityLogin.value.getTime();
      const idleTimeInMintutes = diff / 60000;
      if (idleTimeInMintutes >= MINIMUM_IDLE_TIME_FOR_WARNING_STUDENT) {
        confirmExtendTimeModal();
        startTimer.value = true;
      }
    };

    onMounted(async () => {
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
      startIdleCheckerTimer();
    });

    onUnmounted(() => {
      clearInterval(interval.value);
    });

    const setLastActivityTime = () => {
      if (!route.path.includes(AppRoutes.Login)) {
        lastActivityLogin.value = new Date();
      }
    };

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
        command: async () => {
          await executeLogout(ClientIdType.Student);
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
      setLastActivityTime,
      extendTimeModal,
      startTimer,
      ClientIdType,
    };
  },
};
</script>
