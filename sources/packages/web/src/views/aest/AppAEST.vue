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
import { ClientIdType } from "@/types";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { BCLogo, IdleTimeChecker },
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
    };
  },
};
</script>
