<template>
  <div>
    <NavBar title="Institution Portal" v-if="isAuthReady" />
    <router-view />
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { UserService } from "../../services/UserService";
import NavBar from "../../components/partial-view/student/NavBar.vue";

export default {
  components: {
    NavBar,
  },
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
        const bceIdAccountDetails = await UserService.shared.getBCeIDAccountDetails();

        if (!bceIdAccountDetails.user) {
          //If the user is a basic user, there wont be any bceid details in the response
          router.push({
            name: InstitutionRoutesConst.LOGIN_BASICBCEID,
          });
        } else {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE,
          });
        }
      }
    });

    return {
      isAuthReady,
    };
  },
};
</script>
