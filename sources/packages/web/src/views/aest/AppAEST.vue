<template>
  <IdleTimeChecker :clientIdType="ClientIdType.AEST">
    <v-app-bar dense flat app style="overflow: visible">
      <BCLogo
        subtitle="Ministry of Advanced Education and Skills Training"
      ></BCLogo>
      <v-spacer></v-spacer>
      <v-btn
        v-if="isAuthenticated"
        text
        @click="
          $router.push({ name: AESTRoutesConst.INSTITUTION_PROFILE_CREATE })
        "
        ><v-icon icon="fa:fa fa-edit"></v-icon>Create institution</v-btn
      >
      <v-btn
        v-if="isAuthenticated"
        class="mr-5"
        icon="fa:fa fa-user"
        variant="outlined"
        elevation="1"
        color="grey"
        @click="toggleUserMenu"
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
  </IdleTimeChecker>
</template>

<script lang="ts">
import { ref } from "vue";
import { ClientIdType } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const { executeLogout } = useAuth();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();

    const logoff = async () => {
      await executeLogout(ClientIdType.AEST);
    };

    const toggleUserMenu = (event: any) => {
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
      toggleUserMenu,
      ClientIdType,
      AESTRoutesConst,
    };
  },
};
</script>
