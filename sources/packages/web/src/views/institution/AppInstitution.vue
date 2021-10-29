<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <v-app-bar dense flat app style="overflow:visible">
      <BCLogo subtitle="Institution Application"></BCLogo>
      <v-spacer></v-spacer>
      <v-btn
        v-if="isAuthenticated"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
          })
        "
        >Home</v-btn
      >
      <v-btn
        v-if="isAuthenticated && isAdmin"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          })
        "
        >Manage Institution</v-btn
      >

      <v-btn
        v-if="isAuthenticated"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.INSTITUTION_USER_PROFILE,
          })
        "
        >PROFILE</v-btn
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
      :clientIdType="ClientIdType.Institution"
    />
  </div>
</template>

<script lang="ts">
import { useRoute } from "vue-router";
import { onMounted, ref, onUnmounted } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType, AppRoutes } from "@/types";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { useAuth, ModalDialog } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import "@/assets/css/institution.scss";
import { MINIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION } from "@/constants/system-constants";
import ConfirmExtendTime from "@/components/common/modals/ConfirmExtendTime.vue";

export default {
  components: { BCLogo, ConfirmExtendTime },
  setup() {
    const { executeLogout, executeRenewTokenIfExpired } = useAuth();
    const route = useRoute();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAdmin, isAuthenticated } = useInstitutionAuth();
    const lastActivityLogin = ref(new Date() as Date);
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);

    const startTimer = ref(false);
    const logoff = async () => {
      await executeLogout(ClientIdType.Institution);
    };

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
      const difference =
        new Date().getTime() - lastActivityLogin.value.getTime();
      const idleTimeInMintutes = difference / 60000;
      if (idleTimeInMintutes >= MINIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION) {
        confirmExtendTimeModal();
        startTimer.value = true;
      }
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Notifications Settings",
        icon: "pi pi-bell",
      },
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: logoff,
      },
    ];

    onMounted(async () => {
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
    return {
      userMenuItems,
      isAdmin,
      isAuthenticated,
      logoff,
      userOptionsMenuRef,
      togleUserMenu,
      InstitutionRoutesConst,
      setLastActivityTime,
      extendTimeModal,
      startTimer,
      ClientIdType,
    };
  },
};
</script>
