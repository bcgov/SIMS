<template>
  <div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";

export default {
  setup() {
    const router = useRouter();
    const isAuthReady = ref(false);

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
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      }
    });

    return {
      isAuthReady,
    };
  },
};
</script>
