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
      <v-list-item-title class="text-muted ml-4">STUDENTS</v-list-item-title>
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
        >INSTITUTIONS</v-list-item-title
      >
      <v-list-item>
        <v-list-item-icon>
          <font-awesome-icon :icon="['fas', 'pen-nib']" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Pending designations</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
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
    return {
      items,
    };
  },
};
</script>
