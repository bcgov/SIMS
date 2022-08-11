<template>
  <v-navigation-drawer app class="body-background" permanent>
    <v-list density="compact" nav>
      <v-list-item
        v-for="topItem in topItems"
        :key="topItem.label"
        :prepend-icon="topItem.icon"
        :title="topItem.label"
        @click="topItem.command"
      />
    </v-list>
    <v-list density="compact" nav>
      <v-list-subheader>Student requests</v-list-subheader>
      <v-list-item
        :prepend-icon="exceptionsItem.icon"
        :title="exceptionsItem.label"
        @click="exceptionsItem.command"
      />
      <v-list-item
        :prepend-icon="appealsItem.icon"
        :title="appealsItem.label"
        @click="appealsItem.command"
      />
    </v-list>
    <v-list density="compact" nav>
      <v-list-subheader>Institution requests</v-list-subheader>
      <v-list-item
        :title="designations.label"
        :prepend-icon="designations.icon"
        @click="designations.command"
      />
      <v-list-item
        :title="offerings.label"
        :prepend-icon="offerings.icon"
        @click="offerings.command"
      />
    </v-list>
    <template #append>
      <v-list density="compact" nav>
        <check-permission-role :role="Role.AESTReports">
          <template #="{ notAllowed }">
            <v-list-item
              @click="reports.command"
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
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: { CheckPermissionRole },
  setup() {
    const router = useRouter();
    const topItems = [
      {
        label: "Dashboard",
        icon: "mdi-home-outline",
        command: () => {
          router.push({
            name: AESTRoutesConst.AEST_DASHBOARD,
          });
        },
      },
      {
        label: "Search Students",
        icon: "mdi-magnify",
        command: () => {
          router.push({
            name: AESTRoutesConst.SEARCH_STUDENTS,
          });
        },
      },
      {
        label: "Search Institutions",
        icon: "mdi-magnify",
        command: () => {
          router.push({
            name: AESTRoutesConst.SEARCH_INSTITUTIONS,
          });
        },
      },
    ];

    const exceptionsItem = {
      label: "Exceptions",
      icon: "mdi-alert-circle-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
        });
      },
    } as MenuModel;

    const appealsItem = {
      label: "Appeals",
      icon: "mdi-folder-open-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.APPLICATION_APPEALS_PENDING,
        });
      },
    } as MenuModel;

    const designations = {
      label: "Pending designations",
      icon: "mdi-bookmark-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.PENDING_DESIGNATIONS,
        });
      },
    } as MenuModel;

    const reports = {
      label: "Reports",
      icon: "mdi-home-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.REPORTS,
        });
      },
    } as MenuModel;

    const offerings = {
      label: "Offerings",
      icon: "mdi-view-list-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS,
        });
      },
    } as MenuModel;

    return {
      appealsItem,
      topItems,
      designations,
      exceptionsItem,
      reports,
      offerings,
      AESTRoutesConst,
      Role,
    };
  },
};
</script>
