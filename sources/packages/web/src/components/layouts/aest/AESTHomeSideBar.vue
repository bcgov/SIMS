<template>
  <v-navigation-drawer class="body-background" permanent>
    <v-list density="compact">
      <v-list-item
        v-for="topItem in topItems"
        :key="topItem.label"
        :prepend-icon="topItem.icon"
        :title="topItem.label"
        @click="topItem.command"
      />
    </v-list>
    <v-list density="compact">
      <v-list-subheader>Student requests</v-list-subheader>
      <v-list-item
        :prepend-icon="exceptionsItem.icon"
        :title="exceptionsItem.label"
        @click="exceptionsItem.command"
      />
    </v-list>
    <v-list density="compact">
      <v-list-item-title class="text-muted ml-4"
        >Institution requests</v-list-item-title
      >
      <v-list-item
        :title="pendingDesignationItem.label"
        :prepend-icon="pendingDesignationItem.icon"
        @click="pendingDesignationItem.command"
      />
    </v-list>
    <template #append>
      <v-list density="compact">
        <v-list-item @click="reports.command" :title="reports.label">
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel } from "@/types";

export default {
  setup() {
    const router = useRouter();
    const topItems = ref<MenuModel[]>([
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
    ]);

    const exceptionsItem = ref({
      label: "Exceptions",
      icon: "mdi-alert-circle-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
        });
      },
    } as MenuModel);

    const pendingDesignationItem = ref({
      label: "Pending designations",
      icon: "mdi-bookmark-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.PENDING_DESIGNATIONS,
        });
      },
    } as MenuModel);

    const reports = ref({
      label: "Reports",
      icon: "mdi-home-outline",
      command: () => {
        router.push({
          name: AESTRoutesConst.REPORTS,
        });
      },
    } as MenuModel);

    return {
      topItems,
      pendingDesignationItem,
      exceptionsItem,
      reports,
      AESTRoutesConst,
    };
  },
};
</script>
