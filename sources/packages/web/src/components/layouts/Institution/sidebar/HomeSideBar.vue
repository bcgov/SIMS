<template>
  <Menu :model="items" />
</template>
<script lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";

interface MenuModel {
  label: string;
  icon?: string;
  command?: () => void;
}

export default {
  components: {
    Menu,
  },
  setup() {
    const items = ref<MenuModel[]>([
      {
        label: "Dashboard",
        icon: "pi pi-home",
      },
      {
        label: "Notifications",
        icon: "pi pi-bell",
      },
      {
        label: "LOCATIONS",
      },
      {
        label: "Location 1",
        icon: "pi pi-map-marker",
      },
      {
        label: "Location 2",
        icon: "pi pi-map-marker",
      },
    ]);

    return {
      items,
    };
  },
};
</script>
