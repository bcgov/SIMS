<template>
  <v-navigation-drawer permanent v-model="drawer" color="background">
    <v-list density="compact" bg-color="background">
      <v-list-item
        v-for="item in items"
        :key="item.label"
        :value="item"
        @click="item.command"
        :prepend-icon="item.icon"
        :title="item.label"
        active-color="primary"
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
    const drawer = ref(true);
    const router = useRouter();
    const items = ref<MenuModel[]>([
      {
        label: "Manage Profile",
        icon: "fa:far fa-address-card-o",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          });
        },
      },
      {
        label: "Manage Locations",
        icon: "fa:far fa-compass",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          });
        },
      },
      {
        label: "Manage Designation",
        icon: "fa:far fa-bookmark-o",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_DESIGNATION,
          });
        },
      },
      {
        label: "Manage Users",
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
