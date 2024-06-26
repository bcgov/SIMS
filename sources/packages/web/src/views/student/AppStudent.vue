<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Student">
    <v-app-bar color="white">
      <b-c-logo subtitle="Student Application" @click="logoClick" />
      <v-spacer />
      <v-btn-toggle
        selected-class="active-btn label-bold"
        v-model="toggleNav"
        class="navigation-btn float-left"
      >
        <v-btn
          v-if="hasAuthenticatedStudentAccount"
          class="nav-item-label"
          variant="text"
          :to="{
            name: StudentRoutesConst.STUDENT_DASHBOARD,
          }"
          >Home
          <template #prepend>
            <v-icon
              class="mb-1"
              icon="mdi-home-outline"
              :size="30"
            /> </template
        ></v-btn>
        <v-btn
          v-if="hasAuthenticatedStudentAccount"
          class="nav-item-label"
          variant="text"
          :to="{
            name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
          }"
          prepend-icon="fa:far fa-folder"
          >Applications</v-btn
        >
        <v-btn
          v-if="hasAuthenticatedStudentAccount"
          class="nav-item-label"
          variant="text"
          :to="{ name: StudentRoutesConst.STUDENT_FILE_UPLOADER }"
          prepend-icon="fa:far fa-file-alt"
          >File Uploader</v-btn
        >
        <v-btn
          v-if="hasAuthenticatedStudentAccount"
          class="nav-item-label"
          variant="text"
          :to="{ name: StudentRoutesConst.STUDENT_REQUEST_CHANGE }"
          prepend-icon="fa:far fa-hand-paper"
          >Request a Change</v-btn
        >

        <v-menu v-if="isAuthenticated">
          <template v-slot:activator="{ props }">
            <v-btn
              class="mr-5 nav-item-label"
              rounded="xl"
              icon="fa:fa fa-user"
              variant="outlined"
              elevation="1"
              color="secondary"
              v-bind="props"
              aria-label="Account"
            ></v-btn>
          </template>
          <v-list
            active-class="active-list-item"
            density="compact"
            bg-color="default"
            color="primary"
          >
            <template v-for="(item, index) in menuItems" :key="index">
              <v-list-item
                :value="index"
                @click="item.command"
                :to="item.props?.to"
                tabindex="0"
              >
                <v-list-item-title>
                  <span class="label-bold">{{ item.title }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-divider-inset-opaque
                v-if="index < menuItems.length - 1"
                :key="index"
              ></v-divider-inset-opaque>
            </template>
          </v-list>
        </v-menu>
      </v-btn-toggle>
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
import { computed, ref, defineComponent, onMounted } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType, MenuItemModel } from "@/types";
import { useAuth, useStudentStore } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";
import { AppConfigService } from "@/services/AppConfigService";

export default defineComponent({
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const toggleNav = ref();
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
      const items: MenuItemModel[] = [];
      if (hasStudentAccount.value) {
        items.push(
          {
            title: "Profile",
            props: {
              to: {
                name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
              },
            },
          },
          {
            title: "Account Activity",
            props: {
              to: {
                name: StudentRoutesConst.STUDENT_ACCOUNT_ACTIVITY,
              },
            },
          },
          {
            title: "Overawards Balance",
            props: {
              to: {
                name: StudentRoutesConst.STUDENT_OVERAWARDS,
              },
            },
          },
        );
      }

      items.push({
        title: "Log Out",
        command: async () => {
          await executeLogout(ClientIdType.Student);
        },
      });
      return items;
    });

    onMounted(async () => {
      const { isFulltimeAllowed } = await AppConfigService.shared.config();
      if (!isFulltimeAllowed) {
        menuItems.value.forEach((item, index) => {
          if (item.title === "Overawards Balance") {
            menuItems.value.splice(index, 1);
          }
        });
      }
    });
    return {
      logoClick,
      menuItems,
      isAuthenticated,
      StudentRoutesConst,
      ClientIdType,
      hasAuthenticatedStudentAccount,
      toggleNav,
    };
  },
});
</script>
