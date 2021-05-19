<template>
  <Menu :model="items"/>
</template>
<script lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

interface MenuModel {
  label: string;
  icon: string;
  command?: () => void;
}

export default {
  components: {
    Menu,
  },
  setup() {
    const router = useRouter();
    const items = ref<MenuModel[]>([
      {
        label: "Institution Details",
        icon: "pi pi-info-circle",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          });
        },
      },
      {
        label: "Manage Locations",
        icon: "pi pi-map-marker",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          });
        },
      },
      {
        label: "Manage Designation",
        icon: "pi pi-map",
        command: () => {
          router.push({
            name: InstitutionRoutesConst.MANAGE_DESGINATION,
          });
        },
      },
      {
        label: "Manage Users",
        icon: "pi pi-users",
      },
    ]);

    return {
      items
    };
  },
};
</script>