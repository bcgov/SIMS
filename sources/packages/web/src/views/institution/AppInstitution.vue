<template>
  <v-app-bar dense flat app>
    <v-img
      left
      height="40px"
      alt="logo"
      src="../../assets/images/bc_institution_logo.svg"
    />
    <v-spacer></v-spacer>
    <v-btn
      text
      @click="
        $router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        })
      "
      >Home</v-btn
    >
    <v-btn
      class="mr-3"
      text
      @click="
        $router.push({
          name: InstitutionRoutesConst.MANAGE_LOCATIONS,
        })
      "
      >Manage Institution</v-btn
    >
  </v-app-bar>
  <router-view name="sidebar"></router-view>
  <v-main style="background: #F2F2F2">
    <v-container fluid>
      <router-view></router-view>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { UserService } from "../../services/UserService";
import { AppRoutes } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";

export default {
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isAuthReady = ref(false);
    const clientType = ref(ClientIdType.INSTITUTION);
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );
    // Mounding hook
    onMounted(async () => {
      await AppConfigService.shared.initAuthService(ClientIdType.INSTITUTION);
      isAuthReady.value = true;
      const auth = AppConfigService.shared.authService?.authenticated ?? false;
      if (!auth) {
        router.push({
          name: InstitutionRoutesConst.LOGIN,
        });
      } else {
        if (await UserService.shared.checkUser()) {
          if (await UserService.shared.checkActiveUser()) {
            await InstitutionService.shared.sync();
            if (route.path === AppRoutes.InstitutionRoot) {
              router.push({
                name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
              });
            }
          }
        } else {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE,
          });
        }
      }
    });

    return {
      isAuthReady,
      isAuthenticated,
      InstitutionRoutesConst,
      clientType,
    };
  },
};
</script>
