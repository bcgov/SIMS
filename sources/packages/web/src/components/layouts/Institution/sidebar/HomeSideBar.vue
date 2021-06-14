<template>
  <PanelMenu :model="items" />
</template>
<script lang="ts">
import PanelMenu from "primevue/panelmenu";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ref, onMounted, computed, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

interface MenuModel {
  label: string;
  icon?: string;
  command?: () => void;
  items?: MenuModel[];
}

export default {
  components: {
    PanelMenu,
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const userLocationList = computed(
      () => store.state.institution.myInstitutionLocationsState
    );
    const items = ref<MenuModel[]>([]);

    const getuserLocationList = () => {
      items.value = [
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
      ];
      for (const data of userLocationList.value) {
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
    watch(
      () => userLocationList.value,
      async () => {
        // get user details
        getuserLocationList();
      }
    );
    onMounted(() => {
      // get user details
      if (Array.isArray(userLocationList.value)) {
        getuserLocationList();
      }
    });
    return {
      items,
    };
  },
};
</script>
