<template>
  <v-app-bar dense flat app style="overflow:visible">
    <BCLogo subtitle="Supporting Information for Student Applications"></BCLogo>
    <v-spacer></v-spacer>
    <v-btn
      v-if="isAuthenticated"
      class="mr-5"
      text
      @click="
        $router.push({
          name: SupportingUsersRoutesConst.HOME,
        })
      "
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
</template>

<script lang="ts">
import { ref } from "vue";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import { SupportingUsersRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { BCLogo },
  setup() {
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

    return {
      userMenuItems,
      isAuthenticated,
      logoff,
      userOptionsMenuRef,
      togleUserMenu,
      SupportingUsersRoutesConst,
    };
  },
};
</script>
