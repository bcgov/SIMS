<template>
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item
        v-for="item in items"
        :key="item.label"
        @click="item.command"
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

interface MenuModel {
  label: string;
  icon?: string;
  command?: () => void;
  items?: MenuModel[];
}

export default {
  components: {},
  setup() {
    const router = useRouter();
    const items = ref<MenuModel[]>([]);

    const getuserLocationList = () => {
      items.value = [
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
          label: "Students",
          icon: "mdi-account-multiple-outline",
        },
        {
          label: "Institutions",
          icon: "mdi-city",
        },
        {
          label: "Settings",
          icon: "mdi-wrench",
        },
      ];
    };
    onMounted(() => {
      // get user details
      getuserLocationList();
    });

    return {
      items,
    };
  },
};
</script>
