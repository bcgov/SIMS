<template>
  <idle-time-checker :client-id-type="ClientIdType.AEST">
    <v-app-bar color="white">
      <b-c-logo :subtitle="MINISTRY_NAME"></b-c-logo>
      <v-btn-group class="navigation-btn" :rounded="false">
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
              prepend-icon="fa:far fa-edit"
              :disabled="notAllowed"
              :to="{
                name: AESTRoutesConst.INSTITUTION_PROFILE_CREATE,
              }"
              >Create institution</v-btn
            >
          </template>
        </check-permission-role>
        <v-menu v-if="isAuthenticated">
          <template #activator="{ props }">
            <v-app-bar-account-btn v-bind="props" />
          </template>
          <v-list>
            <v-list-item
              :value="menuItem.label"
              @click="menuItem.command"
              class="my-2"
            >
              <v-list-item-title @click="menuItem.command">
                <span class="label-bold">{{ menuItem.label }}</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn-group>
    </v-app-bar>
    <router-view name="sidebar"></router-view>
    <v-main class="body-background">
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </idle-time-checker>
</template>

<script lang="ts">
import { ClientIdType, Role } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { defineComponent } from "vue";
import { MINISTRY_NAME } from "@/constants/message-constants";

export default defineComponent({
  components: { BCLogo, IdleTimeChecker, CheckPermissionRole },
  setup() {
    const { executeLogout } = useAuth();
    const { isAuthenticated } = useAuth();
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
      MINISTRY_NAME,
    };
  },
});
</script>
