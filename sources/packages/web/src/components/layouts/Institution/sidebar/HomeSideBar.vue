<template>
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item
        v-for="item in items"
        :key="item.label"
        @click="item.command"
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ref, onMounted, computed, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
import { InstitutionUserTypes } from "@/types/contracts/InstitutionRouteMeta";

interface MenuModel {
  label: string;
  icon?: string;
  command?: () => void;
  items?: MenuModel[];
}

export default {
  components: {},
  setup() {
    const store = useStore();
    const router = useRouter();
    const userLocationList = computed(
      () => store.state.institution.locationState,
    );
    const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
    const userAuth = computed(
      () => store.state.institution.authorizationsState?.authorizations,
    );
    const items = ref<MenuModel[]>([]);

    const getuserLocationList = () => {
      items.value = [
        {
          label: "Dashboard",
          icon: "mdi-home-outline",
          command: () => {
            router.push({
              name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
            });
          },
        },
        {
          label: "Notifications",
          icon: "mdi-bell-outline",
        },
        {
          label: "LOCATIONS",
          icon: "pi pi-globe",
        },
      ];
      for (const data of userLocationList.value) {
        const locationsMenu =
          isAdmin.value ||
          userAuth.value?.some(
            (el: InstitutionUserAuthRolesAndLocation) =>
              el?.locationId === data?.id,
          )
            ? {
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
                ],
              }
            : undefined;
        const locationUserMenu =
          isAdmin.value ||
          userAuth.value?.some(
            (el: InstitutionUserAuthRolesAndLocation) =>
              el?.locationId === data?.id &&
              el?.userType === InstitutionUserTypes.locationManager,
          )
            ? {
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
              }
            : undefined;

        if (locationsMenu) {
          if (locationUserMenu) locationsMenu?.items?.push(locationUserMenu);
          items.value.push(locationsMenu);
        }
      }
    };
    watch(
      () => [userLocationList.value, isAdmin.value, userAuth.value],
      () => {
        // get user details
        getuserLocationList();
      },
    );
    onMounted(() => {
      // get user details
      getuserLocationList();
    });

    return {
      items,
      store,
      userLocationList,
    };
  },
};
</script>
