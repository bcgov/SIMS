<template>
  <v-navigation-drawer app permanent v-model="drawer" color="background">
    <!--todo: bind the nav drawer -->
    <v-list
      density="compact"
      bg-color="background"
      active-color="primary"
      :bind="drawer"
    >
      <v-list-item
        class="sidebar-item"
        active-class="active-sidebar-item"
        v-for="item in items"
        :key="item.label"
        :value="item.value"
        @click="item.command"
        :prepend-icon="item.icon"
        :title="item.label"
      />
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel } from "@/types";

export default {
  components: {},
  setup() {
    const drawer = ref("drawer");
    const router = useRouter();
    const items = ref<MenuModel[]>([
      {
        label: "Manage Profile",
        value: "manage-profile",
        icon: "fa:far fa-address-card-o",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          });
        },
      },
      {
        label: "Manage Locations",
        value: "manage-locations",
        icon: "fa:far fa-compass",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          });
        },
      },
      {
        label: "Manage Designation",
        value: "manage-designation",
        icon: "fa:far fa-bookmark-o",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_DESIGNATION,
          });
        },
      },
      {
        label: "Manage Users",
        value: "manage-users",
        icon: "fa:far fa-user-o",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_USERS,
          });
        },
      },
    ]);

    return {
      items,
      drawer,
    };
  },
};
</script>
