<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Student">
    <!-- Adding overflow:visible to allow the use of the Prime Vue
  floating menu while Veutify component is not ready.  -->
    <v-app-bar dense flat app style="overflow: visible">
      <BCLogo subtitle="Student Application" @click="logoClick"></BCLogo>
      <v-spacer></v-spacer
      ><v-btn
        v-if="hasAuthenticatedStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY })
        "
        >Applications</v-btn
      >
      <v-btn
        v-if="hasAuthenticatedStudentAccount"
        text
        @click="$router.push({ name: StudentRoutesConst.NOTIFICATIONS })"
        prepend-icon="fa:far fa-bell"
      >
        Notifications</v-btn
      >
      <v-btn
        v-if="hasAuthenticatedStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_FILE_UPLOADER })
        "
        prepend-icon="fa:far fa-file-alt"
        >File Uploader</v-btn
      >
      <v-btn
        v-if="hasAuthenticatedStudentAccount"
        text
        @click="
          $router.push({ name: StudentRoutesConst.STUDENT_REQUEST_CHANGE })
        "
        prepend-icon="fa:far fa-hand-paper"
        >Request a Change</v-btn
      >
      <v-btn
        v-if="hasAuthenticatedStudentAccount"
        text
        @click="$router.push({ name: StudentRoutesConst.STUDENT_PROFILE_EDIT })"
        >Profile</v-btn
      >
      <v-menu v-if="isAuthenticated">
        <template v-slot:activator="{ props }">
          <v-btn
            class="mr-5"
            icon="fa:fa fa-user"
            variant="outlined"
            elevation="1"
            color="secondary"
            v-bind="props"
          ></v-btn>
        </template>
        <v-list>
          <template v-for="(item, index) in menuItems" :key="index">
            <v-list-item :value="index">
              <v-list-item-title @click="item.command">
                <span class="label-bold">{{ item.label }}</span>
              </v-list-item-title>
            </v-list-item>
            <v-divider
              v-if="index < menuItems.length - 1"
              :key="index"
              inset
            ></v-divider>
          </template>
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
import { useRouter } from "vue-router";
import { computed } from "vue";
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
    const hasAuthenticatedStudentAccount = computed(
      () => isAuthenticated.value && hasStudentAccount.value,
    );
    const menuItems = computed(() => {
      const items: MenuModel[] = [];
      if (hasStudentAccount.value) {
        items.push({
          label: "Notifications Settings",
          command: () => {
            router.push({
              name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
            });
          },
        });

        items.push({
          label: "Account Activity",
          command: () => {
            router.push({
              name: StudentRoutesConst.STUDENT_ACCOUNT_ACTIVITY,
            });
          },
        });
      }

      items.push({
        label: "Log Out",
        command: async () => {
          await executeLogout(ClientIdType.Student);
        },
      });

      return items;
    });

    return {
      logoClick,
      menuItems,
      isAuthenticated,
      StudentRoutesConst,
      ClientIdType,
      hasAuthenticatedStudentAccount,
    };
  },
};
</script>
