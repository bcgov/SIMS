<template>
  <v-app-bar dense flat app>
    <v-img
      max-width="379px"
      height="40px"
      alt="logo"
      src="../../assets/images/bc_institution_logo.svg"
    />
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

    <v-btn v-if="isAuthenticated" text @click="logoff">Log off</v-btn>
  </v-app-bar>
  <router-view name="sidebar"></router-view>
  <v-main class="body-background">
    <v-container fluid>
      <router-view></router-view>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { onMounted, computed } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { UserService } from "../../services/UserService";
import { AppRoutes } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";
import { useStore } from "vuex";
import "@/assets/css/institution.css";

export default {
  components: {},
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );
    const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
    // Mounding hook
    onMounted(async () => {
      await AppConfigService.shared.initAuthService(ClientIdType.INSTITUTION);
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

    const logoff = () => {
      AppConfigService.shared.logout(ClientIdType.INSTITUTION);
    };

    return {
      isAdmin,
      isAuthenticated,
      logoff,
      InstitutionRoutesConst,
    };
  },
};
</script>
<style lang="scss" scoped>
.body-background {
  background: #f2f2f2;
}
</style>
