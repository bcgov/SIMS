<template>
  <Root :clientIdType="ClientIdType.SupportingUsers">
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
  </Root>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref } from "vue";
import { ClientIdType } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import Root from "@/components/common/Root.vue";

export default {
  components: { BCLogo, Root },
  setup() {
    const router = useRouter();
    const { executeLogout } = useAuth();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();

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

    return {
      userMenuItems,
      isAuthenticated,
      logoff,
      userOptionsMenuRef,
      togleUserMenu,
      goToDashboard,
      ClientIdType,
    };
  },
};
</script>
