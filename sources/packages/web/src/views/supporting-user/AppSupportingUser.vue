<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <v-app-bar dense flat app style="overflow:visible">
      <BCLogo
        subtitle="Supporting Information for Student Applications"
        @click="goToDashboard"
      ></BCLogo>
      <v-spacer></v-spacer>
      <v-btn v-if="isAuthenticated" class="mr-5" text @click="goToDashboard"
        >Home</v-btn
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
    <v-main class="body-background ff-form-container">
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
    <ConfirmExtendTime
      ref="extendTimeModal"
      :startTimer="startTimer"
      :clientIdType="ClientIdType.SupportingUsers"
    />
  </div>
</template>

<script lang="ts">
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref, onUnmounted } from "vue";
import { ClientIdType, AppRoutes } from "@/types";
import { useAuth, ModalDialog } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { MINIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER } from "@/constants/system-constants";
import ConfirmExtendTime from "@/components/common/modals/ConfirmExtendTime.vue";

export default {
  components: { BCLogo, ConfirmExtendTime },
  setup() {
    const router = useRouter();
    const { executeLogout, executeRenewTokenIfExpired } = useAuth();
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
      if (idleTimeInMintutes >= MINIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER) {
        confirmExtendTimeModal();
        startTimer.value = true;
      }
    };

    const logoff = async () => {
      await executeLogout(ClientIdType.SupportingUsers);
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: logoff,
      },
    ];

    const goToDashboard = () => {
      router.push({
        name: SupportingUserRoutesConst.DASHBOARD,
      });
    };

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
      isAuthenticated,
      logoff,
      userOptionsMenuRef,
      togleUserMenu,
      goToDashboard,
      setLastActivityTime,
      extendTimeModal,
      startTimer,
      ClientIdType,
    };
  },
};
</script>
