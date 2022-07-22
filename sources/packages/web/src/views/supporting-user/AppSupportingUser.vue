<template>
  <IdleTimeChecker :clientIdType="ClientIdType.SupportingUsers">
    <v-app-bar dense flat app style="overflow: visible">
      <BCLogo
        subtitle="Supporting Information for Student Applications"
        @click="goToDashboard"
      ></BCLogo>
      <v-spacer></v-spacer>
      <v-btn v-if="isAuthenticated" class="mr-5" text @click="goToDashboard"
        >Home</v-btn
      >
      <v-menu v-if="isAuthenticated">
        <template v-slot:activator="{ props }">
          <v-btn
            class="mr-5"
            icon="fa:fa fa-user"
            variant="outlined"
            elevation="1"
            color="grey"
            v-bind="props"
          ></v-btn>
        </template>
        <v-list>
          <template v-for="(item, index) in menuItems" :key="index">
            <v-list-item :value="index">
              <v-list-item-title @click="item.command">
                <span class="label-bold">{{ item.label }}</span>
              </v-list-item-title>
            </v-list-item>
            <v-divider
              v-if="index < menuItems.length - 1"
              :key="index"
              inset
            ></v-divider>
          </template>
        </v-list>
      </v-menu>
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
import { useRouter } from "vue-router";
import { ClientIdType } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const router = useRouter();
    const { executeLogout } = useAuth();
    const { isAuthenticated } = useAuth();
    const logoff = async () => {
      await executeLogout(ClientIdType.SupportingUsers);
    };
    const menuItems = [
      {
        label: "Log Out",
        command: logoff,
      },
    ];

    const goToDashboard = () => {
      router.push({
        name: SupportingUserRoutesConst.DASHBOARD,
      });
    };

    return {
      menuItems,
      isAuthenticated,
      logoff,
      goToDashboard,
      ClientIdType,
    };
  },
};
</script>
