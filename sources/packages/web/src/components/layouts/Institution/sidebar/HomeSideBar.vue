<template>
  <Menu :model="items" />
</template>
<script lang="ts">
import Menu from "primevue/panelmenu";
import { useRouter } from "vue-router";
import { UserService } from "../../../../services/UserService";
import { ref, onMounted } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

interface MenuModel {
  label: string;
  icon?: string;
  command?: () => void;
  items?: MenuModel[];
}

export default {
  components: {
    Menu,
  },
  setup() {
    const router = useRouter();
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
        icon: "pi pi-globe",
      },
    ]);
    const getuserLocationList = async () => {
      const userLocationList = await UserService.shared.getAllUserLocations();
      for (const data of userLocationList) {
        items.value.push({
          label: data.name,
          icon: "pi pi-map-marker",
          items: [
            {
              label: "Programs",
              icon: "pi pi-book",
              command: () => {
                router.push({
                  name: InstitutionRoutesConst.LOCATION_PROGRAMS,
                  params: {
                    locationId: data.id,
                    locationName: data.name,
                  },
                });
              },
            },
            {
              label: "Applications",
              icon: "pi pi-id-card",
              command: () => {
                router.push({
                  name: InstitutionRoutesConst.LOCATION_STUDENTS,
                  params: {
                    locationId: data.id,
                    locationName: data.name,
                  },
                });
              },
            },
            {
              label: "Users",
              icon: "pi pi-users",
              command: () => {
                router.push({
                  name: InstitutionRoutesConst.LOCATION_USERS,
                  params: {
                    locationId: data.id,
                    locationName: data.name,
                  },
                });
              },
            },
          ],
        });
      }
    };
    onMounted(getuserLocationList);
    return {
      items,
      getuserLocationList,
    };
  },
};
</script>
