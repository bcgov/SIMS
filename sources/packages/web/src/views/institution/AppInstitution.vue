<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Institution">
    <v-app-bar color="white">
      <BCLogo subtitle="Institution Application"></BCLogo>
      <!-- todo: ann selected pr active class and submit btn inside vue, check container -->
      <v-btn-toggle v-model="toggleNav" class="nav-btn-padding">
        <v-btn
          v-if="isAuthenticated"
          value="homeBtn"
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
          value="manageInstitutionBtn"
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
          value="myProfileBtn"
          @click="
            $router.push({
              name: InstitutionRoutesConst.INSTITUTION_USER_PROFILE,
            })
          "
          >My Profile</v-btn
        >
        <v-menu v-if="isAuthenticated">
          <template v-slot:activator="{ props }">
            <v-btn
              rounded="xl"
              class="mr-5"
              icon="fa:fa fa-user"
              variant="outlined"
              elevation="1"
              color="secondary"
              v-bind="props"
              value="moreBtn"
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
      </v-btn-toggle>
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
import { ref } from "vue";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const toggleNav = ref("");
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
      toggleNav,
    };
  },
};
</script>
<style>
.nav-btn-padding {
  margin-left: -20%;
}
</style>
