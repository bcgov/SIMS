<template>
  <div>
    <NavBar title="Student Aid" :clientType="clientType" v-if="isAuthReady">
      <template #end>
        <Button
          v-if="isAuthenticated"
          label="Student Profile"
          icon="pi pi-fw pi-user"
          class="p-button-text"
          style="color: white"
          @click="
            $router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })
          "
        />
      </template>
    </NavBar>
    <router-view v-if="isAuthReady" :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed } from "vue";

import NavBar from "../../components/partial-view/student/NavBar.vue";
import { AppConfigService } from "../../services/AppConfigService";
import { UserService } from "../../services/UserService";
import { StudentService } from "../../services/StudentService";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { ClientIdType } from "../../types/contracts/ConfigContract";
import { AppRoutes } from "../../types";

export default {
  components: {
    NavBar,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isAuthReady = ref(false);
    const clientType = ref(ClientIdType.STUDENT);

    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );

    // Mounding hook
    onMounted(async () => {
      await AppConfigService.shared.initAuthService(ClientIdType.STUDENT);
      isAuthReady.value = true;
      const auth = AppConfigService.shared.authService?.authenticated ?? false;
      if (!auth) {
        router.push({
          name: StudentRoutesConst.LOGIN,
        });
      } else {
        // TODO:
        // - Try to implement a role based processing
        // Get path
        if (await UserService.shared.checkUser()) {
          await StudentService.shared.synchronizeFromUserInfo();
          if (route.path === AppRoutes.StudentRoot) {
            // Loading student dash board if user try to load /student path
            router.push({
              name: StudentRoutesConst.STUDENT_DASHBOARD,
            });
          }
        } else {
          /* User doesn't exist in SABC Database and so redirect the user to Student Profile page
       where they can provide information and create SABC account */
          router.push({
            name: StudentRoutesConst.STUDENT_PROFILE,
          });
        }
      }
    });
    return {
      isAuthReady,
      isAuthenticated,
      StudentRoutesConst,
      clientType,
    };
  },
};
</script>

<style lang="scss"></style>
