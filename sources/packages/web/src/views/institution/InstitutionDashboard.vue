<template>
  <div class="p-component p-mx-4">
    <div class="p-grid">
      <div class="p-col-4">
        <Menu :model="items" />
      </div>
      <div class="p-col-8">
        <div v-if="!hideDashboard">
          <h1>Dashboard Work in Progress</h1>
        </div>
        <div v-else>
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Menu from "primevue/menu";
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
    const hideDashboard = ref(false);
    const items = ref<MenuModel[]>([
      {
        label: "Manage institution location",
        icon: "pi pi-map-marker",
        command: () => {
          hideDashboard.value = true;
          router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATION,
          });
        },
      },
    ]);

    return {
      items,
      hideDashboard,
    };
  },
};
</script>

<style></style>
