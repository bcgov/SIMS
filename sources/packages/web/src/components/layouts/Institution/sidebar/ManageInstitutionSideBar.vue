<template>
  <v-navigation-drawer app permanent color="background">
    <v-list density="compact" bg-color="background" active-color="primary">
      <v-list-item
        class="sidebar-item"
        active-class="active-sidebar-item"
        v-for="item in items"
        :key="item.label"
        :to="item.command()"
        :prepend-icon="item.icon"
        :title="item.label"
      />
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel } from "@/types";

export default {
  components: {},
  setup() {
    const items = ref<MenuModel[]>([
      {
        label: "Manage Profile",
        icon: "fa:far fa-address-card-o",
        command: () => ({
          name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
        }),
      },
      {
        label: "Manage Locations",
        icon: "fa:far fa-compass",
        command: () => ({
          name: InstitutionRoutesConst.MANAGE_LOCATIONS,
        }),
      },
      {
        label: "Manage Designation",
        icon: "fa:far fa-bookmark-o",
        command: () => ({
          name: InstitutionRoutesConst.MANAGE_DESIGNATION,
        }),
      },
      {
        label: "Manage Users",
        icon: "fa:far fa-user-o",
        command: () => ({
          name: InstitutionRoutesConst.MANAGE_USERS,
        }),
      },
    ]);

    return {
      items,
    };
  },
};
</script>
