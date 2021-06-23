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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

interface MenuModel {
  label: string;
  icon: string;
  command?: () => void;
}

export default {
  components: {},
  setup() {
    const router = useRouter();
    const items = ref<MenuModel[]>([
      {
        label: "Institution Details",
        icon: "mdi-alert-circle-outline",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          });
        },
      },
      {
        label: "Manage Locations",
        icon: "mdi-office-building-outline",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          });
        },
      },
      {
        label: "Manage Designation",
        icon: "mdi-certificate-outline",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_DESGINATION,
          });
        },
      },
      {
        label: "Manage Users",
        icon: "mdi-account-group",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_USERS,
          });
        },
      },
    ]);

    return {
      items,
    };
  },
};
</script>
