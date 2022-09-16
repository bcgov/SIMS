<template>
  <v-navigation-drawer app color="background" permanent>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
      class="no-wrap"
      :items="topItems"
    />
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
      class="no-wrap"
      :items="studentRequestsItems"
    />
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
      class="no-wrap"
      :items="institutionRequestsItems"
    />
    <template #append>
      <v-list
        density="compact"
        active-class="active-sidebar-item"
        bg-color="background"
        class="no-wrap"
        active-color="primary"
        nav
      >
        <check-permission-role :role="Role.AESTReports">
          <template #="{ notAllowed }">
            <v-list-item
              :to="{ name: AESTRoutesConst.REPORTS }"
              prepend-icon="mdi-home-outline"
              title="Reports"
              :disabled="notAllowed"
            />
          </template>
        </check-permission-role>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, Role } from "@/types";
import { ref } from "vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: { CheckPermissionRole },
  setup() {
    const topItems = ref<MenuItemModel[]>([
      {
        title: "Home",
        props: {
          prependIcon: "mdi-home-outline",
          to: {
            name: AESTRoutesConst.AEST_DASHBOARD,
          },
        },
      },
      {
        title: "Search Students",
        props: {
          prependIcon: "mdi-magnify",
          to: {
            name: AESTRoutesConst.SEARCH_STUDENTS,
          },
        },
      },
      {
        title: "Search Institutions",
        props: {
          prependIcon: "mdi-magnify",
          to: {
            name: AESTRoutesConst.SEARCH_INSTITUTIONS,
          },
        },
      },
    ]);
    const studentRequestsItems = ref<MenuItemModel[]>([
      {
        type: "subheader",
        title: "Student requests",
      },
    ]);
    studentRequestsItems.value.push(
      {
        title: "Accounts",
        props: {
          prependIcon: "mdi-account-outline",
          to: {
            name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS,
          },
        },
      },
      {
        title: "Exceptions",
        props: {
          prependIcon: "mdi-alert-circle-outline",
          to: {
            name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
          },
        },
      },
      {
        title: "Appeals",
        props: {
          prependIcon: "mdi-folder-open-outline",
          to: {
            name: AESTRoutesConst.APPLICATION_APPEALS_PENDING,
          },
        },
      },
    );
    const institutionRequestsItems = ref<MenuItemModel[]>([
      {
        type: "subheader",
        title: "Institution requests",
      },
    ]);
    institutionRequestsItems.value.push(
      {
        title: "Designations",
        props: {
          prependIcon: "mdi-bookmark-outline",
          to: {
            name: AESTRoutesConst.PENDING_DESIGNATIONS,
          },
        },
      },
      {
        title: "Offerings",
        props: {
          prependIcon: "mdi-view-list-outline",
          to: {
            name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS,
          },
        },
      },
    );
    return {
      topItems,
      studentRequestsItems,
      institutionRequestsItems,
      AESTRoutesConst,
      Role,
    };
  },
};
</script>
