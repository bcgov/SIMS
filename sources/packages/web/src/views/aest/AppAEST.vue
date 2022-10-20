<template>
  <IdleTimeChecker :clientIdType="ClientIdType.AEST">
    <v-app-bar color="white">
      <b-c-logo
        subtitle="Ministry of Advanced Education and Skills Training"
      ></b-c-logo>
      <v-btn-toggle
        selected-class="active-btn label-bold"
        v-model="toggleNav"
        class="navigation-btn float-left"
      >
        <check-permission-role :role="Role.AESTCreateInstitution">
          <template #="{ notAllowed }">
            <v-btn
              v-if="isAuthenticated"
              class="nav-item-label"
              variant="text"
              :to="{
                name: AESTRoutesConst.AEST_DASHBOARD,
              }"
              >Home</v-btn
            >
            <v-btn
              v-if="isAuthenticated"
              variant="text"
              prepend-icon="fa:fa fa-edit"
              :disabled="notAllowed"
              @click="
                $router.push({
                  name: AESTRoutesConst.INSTITUTION_PROFILE_CREATE,
                })
              "
              >Create institution</v-btn
            >
          </template>
        </check-permission-role>
        <v-menu v-if="isAuthenticated">
          <template v-slot:activator="{ props }">
            <v-btn
              class="mr-5"
              icon="fa:fa fa-user"
              variant="outlined"
              elevation="1"
              color="secondary"
              v-bind="props"
            ></v-btn>
          </template>
          <v-list>
            <v-list-item :value="menuItem.label">
              <v-list-item-title>
                <v-list-item-title @click="menuItem.command">
                  <span class="label-bold">{{ menuItem.label }}</span>
                </v-list-item-title>
              </v-list-item-title>
            </v-list-item>
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
import { ClientIdType, Role } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { ref } from "vue";

export default {
  components: { BCLogo, IdleTimeChecker, CheckPermissionRole },
  setup() {
    const { executeLogout } = useAuth();
    const { isAuthenticated } = useAuth();
    const toggleNav = ref("toggle-nav");
    const logoff = async () => {
      await executeLogout(ClientIdType.AEST);
    };
    const menuItem = {
      label: "Log Out",
      command: logoff,
    };

    return {
      menuItem,
      isAuthenticated,
      logoff,
      ClientIdType,
      AESTRoutesConst,
      Role,
      toggleNav,
    };
  },
};
</script>
