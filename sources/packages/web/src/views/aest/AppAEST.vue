<template>
  <IdleTimeChecker :clientIdType="ClientIdType.AEST">
    <v-app-bar dense flat app style="overflow: visible">
      <BCLogo
        subtitle="Ministry of Advanced Education and Skills Training"
      ></BCLogo>
      <v-spacer></v-spacer>
      <check-a-e-s-t-permission-role :role="Role.AESTCreateInstitution">
        <template v-slot="{ isReadonly }">
          <v-btn
            v-if="isAuthenticated"
            variant="text"
            prepend-icon="fa:fa fa-edit"
            :disabled="isReadonly"
            @click="
              $router.push({ name: AESTRoutesConst.INSTITUTION_PROFILE_CREATE })
            "
            >Create institution</v-btn
          >
        </template>
      </check-a-e-s-t-permission-role>
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
import CheckAESTPermissionRole from "@/components/generic/CheckAESTPermissionRole.vue";

export default {
  components: { BCLogo, IdleTimeChecker, CheckAESTPermissionRole },
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
    };
  },
};
</script>
