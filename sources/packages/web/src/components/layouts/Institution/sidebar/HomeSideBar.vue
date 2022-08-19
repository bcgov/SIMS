<template>
  <v-navigation-drawer app v-model="drawer" color="background" permanent>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
      :bind="drawer"
    >
      <v-list-item
        v-for="item in items"
        :key="item.label"
        @click="item.command"
        :prepend-icon="item.icon"
        :title="item.label"
        :value="item.value"
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
          @click="locationItem.command"
          :value="locationItem.value"
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
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ref, onMounted, computed, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { MenuModel } from "@/types";

export default {
  setup() {
    const drawer = ref("drawer");
    const store = useStore();
    const router = useRouter();
    const { isAdmin, userAuth } = useInstitutionAuth();
    const userLocationList = computed(
      () => store.state.institution.locationState,
    );

    const items = ref<MenuModel[]>([]);
    const locationsMenu = ref<MenuModel[]>([]);

    const getuserLocationList = () => {
      items.value = [
        {
          label: "Dashboard",
          value: "dashboard",
          icon: "mdi-home-outline",
          command: () => {
            router.push({
              name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
            });
          },
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
                value: data.id,
                icon: "mdi-map-marker-outline",
                items: [
                  {
                    label: "Programs",
                    value: `programs-${data.id}`,
                    icon: "fa:far fa-folder-open",
                    command: () => {
                      router.push({
                        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
                        params: {
                          locationId: data.id,
                        },
                      });
                    },
                  },
                  {
                    label: "Program Info Requests",
                    value: `program-info-requests-${data.id}`,
                    icon: "fa:far fa-paper-plane",
                    command: () => {
                      router.push({
                        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
                        params: {
                          locationId: data.id,
                          locationName: data.name,
                        },
                      });
                    },
                  },
                  {
                    label: "Confirm Enrolment",
                    value: `confirm-enrolment-${data.id}`,
                    icon: "fa:far fa-check-square",
                    command: () => {
                      router.push({
                        name: InstitutionRoutesConst.COE_SUMMARY,
                        params: {
                          locationId: data.id,
                          locationName: data.name,
                        },
                      });
                    },
                  },
                  {
                    label: "Report a Change",
                    value: `report-a-change-${data.id}`,
                    icon: "fa:far fa-hand-paper",
                    command: () => {
                      router.push({
                        name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
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

        if (locationMenu) {
          locationsMenu.value.push(locationMenu);
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
      locationsMenu,
      drawer,
    };
  },
};
</script>
<style>
/* todo: ann move the css */
.nav-subtitle {
  font-style: normal;
  /* font-size: 12px; */
  line-height: 16px;
  letter-spacing: 3px;
  text-transform: uppercase;
  mix-blend-mode: normal;
}
</style>
