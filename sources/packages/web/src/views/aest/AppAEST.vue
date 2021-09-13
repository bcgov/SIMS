<template>
  <v-app-bar dense flat app style="overflow:visible">
    <v-img
      class="ml-5"
      max-width="379px"
      height="40px"
      alt="logo"
      src="../../assets/images/bc_institution_logo.svg"
    />
    <v-spacer></v-spacer>
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
import { ref } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { useAuth } from "@/composables";

export default {
  components: {},
  setup() {
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();

    const logoff = () => {
      AppConfigService.shared.logout(ClientIdType.AEST);
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: () => {
          AppConfigService.shared.logout(ClientIdType.AEST);
        },
      },
    ];

    return {
      userMenuItems,
      isAuthenticated,
      logoff,
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
