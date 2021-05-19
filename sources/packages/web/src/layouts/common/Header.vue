<template>
  <div>
    <NavBar
      title="INSTITUTION APPLICATION"
      :clientType="clientType"
      v-if="isAuthReady"
    >
      <template #end>
        <Button
          v-if="isAuthenticated"
          label="Home"
          icon="pi pi-fw pi-home"
          class="p-button-text"
          style="color: white"
          @click="clickedHome()"
        />
        <Button
          v-if="isAuthenticated"
          label="Manage Institution"
          icon="pi pi-fw pi-map-marker"
          class="p-button-text"
          style="color: white"
          @click="clickedManageLocation()"
        />
      </template>
    </NavBar>
  </div>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import NavBar from "../../components/partial-view/student/NavBar.vue";
import { UserService } from "../../services/UserService";
import { AppRoutes } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";

export default {
  components: {
    NavBar,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isAuthReady = ref(false);
    const clientType = ref(ClientIdType.INSTITUTION);
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );
    const clickedHome = () => {
      router.push({ name: InstitutionRoutesConst.INSTITUTION_DASHBOARD });
    };
    const clickedManageLocation = () => {
      router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
    };
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
          await InstitutionService.shared.sync();
          if (route.path === AppRoutes.InstitutionRoot) {
            router.push({
              name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
            });
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
      clickedHome,
      clickedManageLocation
    };
  },
};
</script>
