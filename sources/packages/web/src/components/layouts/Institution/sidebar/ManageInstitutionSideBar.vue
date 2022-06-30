<template>
  <v-navigation-drawer app class="body-background" permanent>
    <v-list density="compact" nav>
      <v-list-item
        v-for="item in items"
        :key="item.label"
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
            name: InstitutionRoutesConst.MANAGE_DESIGNATION,
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
