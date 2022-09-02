<template>
  <v-navigation-drawer app color="background" permanent>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
    >
      <v-list-item
        v-for="item in items"
        :key="item.label"
        :to="item.command()"
        :prepend-icon="item.icon"
        :title="item.label"
      />
      <v-list-subheader class="nav-subtitle">Locations</v-list-subheader>
      <v-list-group
        v-for="location in locationsMenu"
        :key="location.label"
        collapse-icon="mdi-chevron-up"
        expand-icon="mdi-chevron-down"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :title="location.label"
            :prepend-icon="location.icon"
            :value="location.value"
          >
            <v-tooltip activator="parent">{{ location.label }}</v-tooltip>
          </v-list-item>
        </template>
        <v-list-item
          class="mx-4"
          v-for="locationItem in location?.items"
          :key="locationItem"
          :title="locationItem.label"
          :to="locationItem.command()"
          ><template v-slot:prepend>
            <v-icon :icon="locationItem.icon" size="20"
          /></template>
          <v-tooltip activator="parent">{{ locationItem.label }}</v-tooltip>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { useStore } from "vuex";
import { ref, computed, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { MenuModel } from "@/types";

export default {
  setup() {
    const store = useStore();
    const { isAdmin, userAuth } = useInstitutionAuth();
    const userLocationList = computed(
      () => store.state.institution.locationState,
    );

    const items = ref<MenuModel[]>([]);
    const locationsMenu = ref<MenuModel[]>([]);

    const getUserLocationList = () => {
      items.value = [
        {
          label: "Home",
          icon: "mdi-home-outline",
          command: () => ({
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
          }),
        },
      ];
      for (const data of userLocationList.value) {
        const locationMenu =
          isAdmin.value ||
          userAuth.value?.some(
            (el: InstitutionUserAuthRolesAndLocation) =>
              el?.locationId === data?.id,
          )
            ? {
                label: data.name,
                icon: "mdi-map-marker-outline",
                items: [
                  {
                    label: "Programs",
                    icon: "fa:far fa-folder-open",
                    command: () => ({
                      name: InstitutionRoutesConst.LOCATION_PROGRAMS,
                      params: {
                        locationId: data.id,
                      },
                    }),
                  },
                  {
                    label: "Program Info Requests",
                    icon: "fa:far fa-paper-plane",
                    command: () => ({
                      name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
                      params: {
                        locationId: data.id,
                      },
                    }),
                  },
                  {
                    label: "Confirm Enrolment",
                    icon: "fa:far fa-check-square",
                    command: () => ({
                      name: InstitutionRoutesConst.COE_SUMMARY,
                      params: {
                        locationId: data.id,
                      },
                    }),
                  },
                  {
                    label: "Report a Change",
                    icon: "fa:far fa-hand-paper",
                    command: () => ({
                      name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
                      params: {
                        locationId: data.id,
                      },
                    }),
                  },
                ],
              }
            : undefined;

        if (locationMenu) {
          locationsMenu.value.push(locationMenu);
        }
      }
    };
    watch(
      () => [userLocationList.value, isAdmin.value, userAuth.value],
      () => {
        // get user details
        getUserLocationList();
      },
      { immediate: true },
    );

    return {
      items,
      userLocationList,
      locationsMenu,
    };
  },
};
</script>
