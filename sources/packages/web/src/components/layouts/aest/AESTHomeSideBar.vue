<template>
  <v-navigation-drawer app v-model="drawer" color="background" permanent>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
    >
      <v-list-item
        v-for="topItem in topItems"
        :key="topItem.label"
        :prepend-icon="topItem.icon"
        :title="topItem.label"
        :to="topItem.command()"
      />
    </v-list>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
    >
      <v-list-subheader class="nav-subtitle">Student requests</v-list-subheader>
      <v-list-item
        :prepend-icon="studentAccountApplicationItem.icon"
        :title="studentAccountApplicationItem.label"
        :to="studentAccountApplicationItem.command()"
      />
      <v-list-item
        :prepend-icon="exceptionsItem.icon"
        :title="exceptionsItem.label"
        :to="exceptionsItem.command()"
      />
      <v-list-item
        :prepend-icon="appealsItem.icon"
        :title="appealsItem.label"
        :to="appealsItem.command()"
      />
    </v-list>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
    >
      <v-list-subheader class="nav-subtitle"
        >Institution requests</v-list-subheader
      >
      <v-list-item
        :title="designations.label"
        :prepend-icon="designations.icon"
        :to="designations.command()"
      />
      <v-list-item
        :title="offerings.label"
        :prepend-icon="offerings.icon"
        :to="offerings.command()"
      />
    </v-list>
    <template #append>
      <v-list density="compact" nav>
        <check-permission-role :role="Role.AESTReports">
          <template #="{ notAllowed }">
            <v-list-item
              :to="reports.command()"
              :title="reports.label"
              :disabled="notAllowed"
            />
          </template>
        </check-permission-role>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: { CheckPermissionRole },
  setup() {
    const drawer = ref("drawer");
    const topItems = [
      {
        label: "Home",
        icon: "mdi-home-outline",
        command: () => ({
          name: AESTRoutesConst.AEST_DASHBOARD,
        }),
      },
      {
        label: "Search Students",
        icon: "mdi-magnify",
        command: () => ({
          name: AESTRoutesConst.SEARCH_STUDENTS,
        }),
      },
      {
        label: "Search Institutions",
        icon: "mdi-magnify",
        command: () => ({
          name: AESTRoutesConst.SEARCH_INSTITUTIONS,
        }),
      },
    ];

    const studentAccountApplicationItem = {
      label: "Accounts",
      icon: "mdi-account-outline",
      command: () => ({
        name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS,
      }),
    } as MenuModel;

    const exceptionsItem = {
      label: "Exceptions",
      icon: "mdi-alert-circle-outline",
      command: () => ({
        name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
      }),
    } as MenuModel;

    const appealsItem = {
      label: "Appeals",
      icon: "mdi-folder-open-outline",
      command: () => ({
        name: AESTRoutesConst.APPLICATION_APPEALS_PENDING,
      }),
    } as MenuModel;

    const designations = {
      label: "Pending designations",
      icon: "mdi-bookmark-outline",
      command: () => ({
        name: AESTRoutesConst.PENDING_DESIGNATIONS,
      }),
    } as MenuModel;

    const reports = {
      label: "Reports",
      icon: "mdi-home-outline",
      command: () => ({
        name: AESTRoutesConst.REPORTS,
      }),
    } as MenuModel;

    const offerings = {
      label: "Offerings",
      icon: "mdi-view-list-outline",
      command: () => ({
        name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS,
      }),
    } as MenuModel;

    return {
      appealsItem,
      topItems,
      designations,
      studentAccountApplicationItem,
      exceptionsItem,
      reports,
      offerings,
      AESTRoutesConst,
      Role,
      drawer,
    };
  },
};
</script>
