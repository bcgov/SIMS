<template>
  <IdleTimeChecker :client-id-type="ClientIdType.Institution">
    <v-app-bar color="white">
      <b-c-logo subtitle="Institutions" />
      <v-btn-group class="navigation-btn" :rounded="false">
        <v-btn
          v-if="isAuthenticatedInstitutionUser"
          class="nav-item-label"
          variant="text"
          data-cy="institutionHome"
          :to="{
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
          }"
          >Home</v-btn
        >
        <v-btn
          class="nav-item-label"
          v-if="isAuthenticatedInstitutionUser && isAdmin"
          variant="text"
          data-cy="manageInstitutions"
          :to="{
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          }"
          >Manage Institution</v-btn
        >

        <v-btn
          class="nav-item-label"
          v-if="isAuthenticatedInstitutionUser"
          variant="text"
          data-cy="myProfile"
          :to="{
            name: InstitutionRoutesConst.INSTITUTION_USER_PROFILE,
          }"
          >My Profile</v-btn
        >
        <v-menu v-if="isAuthenticated">
          <template #activator="{ props }">
            <v-app-bar-account-btn v-bind="props" />
          </template>
          <v-list
            active-class="active-list-item"
            density="compact"
            bg-color="default"
            color="primary"
          >
            <template v-for="(item, index) in menuItems" :key="index">
              <v-list-item :value="index" @click="item.command" class="my-2">
                <v-list-item-title>
                  <span class="label-bold" data-cy="settingsButton">{{
                    item.label
                  }}</span>
                </v-list-item-title>
              </v-list-item>
            </template>
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
import { defineComponent } from "vue";

export default defineComponent({
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const { executeLogout } = useAuth();
    const { isAdmin, isAuthenticated, isAuthenticatedInstitutionUser } =
      useInstitutionAuth();
    const logoff = async () => {
      await executeLogout(ClientIdType.Institution);
    };
    const menuItems = [
      {
        label: "Log Out",
        command: logoff,
      },
    ];

    return {
      menuItems,
      isAdmin,
      isAuthenticated,
      isAuthenticatedInstitutionUser,
      logoff,
      InstitutionRoutesConst,
      ClientIdType,
    };
  },
});
</script>
