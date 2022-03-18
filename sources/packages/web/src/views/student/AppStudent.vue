<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Student">
    <!-- Adding overflow:visible to allow the use of the Prime Vue
  floating menu while Veutify component is not ready.  -->
    <v-app-bar dense flat app style="overflow:visible">
      <BCLogo subtitle="Student Application" @click="logoClick"></BCLogo>
      <v-spacer></v-spacer
      ><v-btn
        v-if="isStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY })
        "
        >Applications</v-btn
      >
      <v-btn
        v-if="isStudentAccount"
        text
        @click="$router.push({ name: StudentRoutesConst.NOTIFICATIONS })"
        ><font-awesome-icon :icon="['fas', 'bell']" class="mr-2" />
        Notifications</v-btn
      >
      <v-btn
        v-if="isStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_FILE_UPLOADER })
        "
        ><font-awesome-icon :icon="['fas', 'file-alt']" class="mr-2" />File
        Uploader</v-btn
      >
      <v-btn
        v-if="isStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_REQUEST_CHANGE })
        "
        ><font-awesome-icon :icon="['fas', 'hand-paper']" class="mr-2" />Request
        a Change</v-btn
      >
      <v-btn
        v-if="isStudentAccount"
        text
        @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
        >Profile</v-btn
      >
      <v-btn
        v-if="isAuthenticated"
        class="mr-5"
        icon="mdi-account"
        outlined
        elevation="1"
        color="grey"
        @click="togleUserMenu"
      ></v-btn>
      <Menu
        v-if="isAuthenticated"
        ref="userOptionsMenuRef"
        :model="userMenuItems"
        :popup="true"
      />
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
import { useRouter } from "vue-router";
import { ref, computed } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType, MenuModel } from "@/types";
import { useAuth, useStudentStore } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const { executeLogout } = useAuth();
    const router = useRouter();
    const userOptionsMenuRef = ref();
    const { isAuthenticated } = useAuth();
    const { hasStudentAccount } = useStudentStore();

    const logoClick = () => {
      if (hasStudentAccount.value) {
        const routeName = isAuthenticated.value
          ? StudentRoutesConst.STUDENT_DASHBOARD
          : StudentRoutesConst.LOGIN;
        router.push({
          name: routeName,
        });
      }
    };

    const isStudentAccount = computed(
      () => isAuthenticated && hasStudentAccount,
    );

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    const userMenuItems = computed(() => {
      const menuItems: MenuModel[] = [];
      if (hasStudentAccount.value) {
        menuItems.push({
          label: "Notifications Settings",
          icon: "pi pi-bell",
          command: () => {
            router.push({
              name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
            });
          },
        });
      }

      menuItems.push({
        label: "Log off",
        icon: "pi pi-power-off",
        command: async () => {
          await executeLogout(ClientIdType.Student);
        },
      });

      return menuItems;
    });

    return {
      logoClick,
      userMenuItems,
      isAuthenticated,
      StudentRoutesConst,
      userOptionsMenuRef,
      togleUserMenu,
      ClientIdType,
      isStudentAccount,
    };
  },
};
</script>
