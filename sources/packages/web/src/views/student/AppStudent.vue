<template>
  <!-- Adding overflow:visible to allow the use of the Prime Vue
  floating menu while Veutify component is not ready.  -->
  <v-app-bar dense flat app style="overflow:visible">
    <BCLogo subtitle="Student Application" @click="logoClick"></BCLogo>
    <v-spacer></v-spacer
    ><v-btn
      v-if="isAuthenticated"
      text
      @click="
        $router.push({ name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY })
      "
      >ApplicationS</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
      text
      @click="$router.push({ name: StudentRoutesConst.NOTIFICATIONS })"
      >Notifications</v-btn
    >
    <v-btn
      v-if="isAuthenticated"
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
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";

export default {
  components: { BCLogo },
  setup() {
    const { executeLogout } = useAuth();
    const router = useRouter();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAuthenticated } = useAuth();

    const logoClick = () => {
      const routeName = isAuthenticated.value
        ? StudentRoutesConst.STUDENT_DASHBOARD
        : StudentRoutesConst.LOGIN;
      router.push({
        name: routeName,
      });
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Notifications Settings",
        icon: "pi pi-bell",
        command: () => {
          router.push({
            name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
          });
        },
      },
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: async () => {
          await executeLogout(ClientIdType.Student);
        },
      },
    ];

    return {
      logoClick,
      userMenuItems,
      isAuthenticated,
      StudentRoutesConst,
      userOptionsMenuRef,
      togleUserMenu,
    };
  },
};
</script>
