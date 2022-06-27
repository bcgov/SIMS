<template>
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item
        v-for="item in items"
        :key="item.label"
        @click="item.command"
      >
        <v-list-item-icon>
          <font-awesome-icon :icon="item.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-list dense nav>
      <v-list-item-title class="text-muted ml-4"
        >Student requests</v-list-item-title
      >
      <v-list-item @click="exceptionsItem.command">
        <v-list-item-icon>
          <font-awesome-icon :icon="exceptionsItem.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ exceptionsItem.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-icon>
          <font-awesome-icon :icon="['fas', 'folder-open']" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Pending applications</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-list dense nav>
      <v-list-item-title class="text-muted ml-4"
        >Institution requests</v-list-item-title
      >
      <v-list-item @click="pendingDesignationItem.command">
        <v-list-item-icon>
          <font-awesome-icon :icon="pendingDesignationItem.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{
            pendingDesignationItem.label
          }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <template #append>
      <v-list dense nav>
        <v-list-item @click="reports.command">
          <v-list-item-icon>
            <font-awesome-icon :icon="reports.icon" class="mr-2" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ reports.label }}</v-list-item-title>
          </v-list-item-content>
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
    const items = ref<MenuModel[]>([
      {
        label: "Dashboard",
        icon: ["fas", "home"],
        command: () => {
          router.push({
            name: AESTRoutesConst.AEST_DASHBOARD,
          });
        },
      },
      {
        label: "Search Students",
        icon: ["fas", "search"],
        command: () => {
          router.push({
            name: AESTRoutesConst.SEARCH_STUDENTS,
          });
        },
      },
      {
        label: "Search Institutions",
        icon: ["fas", "search"],
        command: () => {
          router.push({
            name: AESTRoutesConst.SEARCH_INSTITUTIONS,
          });
        },
      },
      {
        label: "Settings",
        icon: ["fas", "cog"],
      },
    ]);

    const pendingDesignationItem = ref({
      label: "Pending designations",
      icon: ["fas", "pen-nib"],
      command: () => {
        router.push({
          name: AESTRoutesConst.PENDING_DESIGNATIONS,
        });
      },
    } as MenuModel);

    const reports = ref({
      label: "Reports",
      icon: ["far", "copy"],
      command: () => {
        router.push({
          name: AESTRoutesConst.REPORTS,
        });
      },
    } as MenuModel);

    const exceptionsItem = ref({
      label: "Exceptions",
      icon: ["far", "check-circle"],
      command: () => {
        router.push({
          name: AESTRoutesConst.EXCEPTIONS,
        });
      },
    } as MenuModel);

    return {
      items,
      pendingDesignationItem,
      exceptionsItem,
      reports,
    };
  },
};
</script>
