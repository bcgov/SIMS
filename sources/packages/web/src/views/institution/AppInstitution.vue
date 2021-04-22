<template>
  <div>
    <NavBar
      title="Institution Portal"
      :clientType="clientType"
      v-if="isAuthReady"
    >
      <template #end>
        <Button
          v-if="isAuthenticated"
          label="Institution Profile"
          icon="pi pi-fw pi-user"
          class="p-button-text"
          style="color: white"
          @click="
            $router.push({
              name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
            })
          "
        />
      </template>
    </NavBar>
    <router-view v-if="isAuthReady" />
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
    };
  },
};
</script>
