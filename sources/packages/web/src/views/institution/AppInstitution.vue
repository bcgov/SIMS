<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Institution">
    <v-app-bar dense flat app style="overflow: visible">
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
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType } from "@/types";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import "@/assets/css/institution.scss";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const { executeLogout } = useAuth();
    const { isAdmin, isAuthenticated } = useInstitutionAuth();
    const logoff = async () => {
      await executeLogout(ClientIdType.Institution);
    };
    const menuItems = [
      {
        label: "Notifications Settings",
      },
      {
        label: "Log Out",
        command: logoff,
      },
    ];

    return {
      menuItems,
      isAdmin,
      isAuthenticated,
      logoff,
      InstitutionRoutesConst,
      ClientIdType,
    };
  },
};
</script>
