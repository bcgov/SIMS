<template>
  <v-navigation-drawer app permanent color="background">
    <v-list
      density="compact"
      bg-color="background"
      active-color="primary"
      class="sidebar-item no-wrap"
      active-class="active-sidebar-item"
      :items="items"
    />
  </v-navigation-drawer>
</template>
<script lang="ts">
import { ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel } from "@/types";

export default {
  components: {},
  setup() {
    const items = ref<MenuItemModel[]>([
      {
        title: "Manage Profile",
        props: {
          prependIcon: "fa:far fa-address-card-o",
          to: {
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          },
        },
      },
      {
        title: "Manage Locations",
        props: {
          prependIcon: "fa:far fa-compass",
          to: {
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          },
        },
      },
      {
        title: "Manage Designation",
        props: {
          prependIcon: "fa:far fa-bookmark-o",
          to: {
            name: InstitutionRoutesConst.MANAGE_DESIGNATION,
          },
        },
      },
      {
        title: "Manage Users",
        props: {
          prependIcon: "fa:far fa-user-o",
          to: {
            name: InstitutionRoutesConst.MANAGE_USERS,
          },
        },
      },
    ]);

    return {
      items,
    };
  },
};
</script>
