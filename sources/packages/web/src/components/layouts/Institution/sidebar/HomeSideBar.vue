<template>
  <v-navigation-drawer app color="background" permanent>
    <v-list
      active-class="active-sidebar-item"
      density="compact"
      bg-color="background"
      active-color="primary"
      class="no-wrap"
      :items="items"
    />
  </v-navigation-drawer>
</template>
<script lang="ts">
import { useStore } from "vuex";
import { ref, computed, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { MenuInterface } from "@/types";

export default {
  setup() {
    const store = useStore();
    const { isAdmin, userAuth } = useInstitutionAuth();
    const userLocationList = computed(
      () => store.state.institution.locationState,
    );

    const items = ref<MenuInterface[]>([
      {
        title: "Home",
        props: {
          prependIcon: "mdi-home-outline",
          to: {
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
          },
        },
      },
    ]);
    const locationsMenu = ref<any[]>([]);

    const getUserLocationList = () => {
      if (userLocationList.value) {
        items.value.push({ type: "subheader", title: "Locations" });
      }
      for (const data of userLocationList.value) {
        if (
          isAdmin.value ||
          userAuth.value?.some(
            (el: InstitutionUserAuthRolesAndLocation) =>
              el?.locationId === data?.id,
          )
        ) {
          items.value.push({
            title: data.name as string,
            props: {
              prependIcon: "mdi-map-marker-outline",
            },
            children: [
              {
                title: "Programs",
                props: {
                  prependIcon: "fa:far fa-folder-open",
                  to: {
                    name: InstitutionRoutesConst.LOCATION_PROGRAMS,
                    params: {
                      locationId: data.id,
                    },
                  },
                },
              },
              {
                title: "Program Info Requests",
                props: {
                  prependIcon: "fa:far fa-paper-plane",
                  to: {
                    name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
                    params: {
                      locationId: data.id,
                    },
                  },
                },
              },
              {
                title: "Confirm Enrolment",
                props: {
                  prependIcon: "fa:far fa-check-square",
                  to: {
                    name: InstitutionRoutesConst.COE_SUMMARY,
                    params: {
                      locationId: data.id,
                    },
                  },
                },
              },
              {
                title: "Report a Change",
                props: {
                  prependIcon: "fa:far fa-hand-paper",
                  to: {
                    name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
                    params: {
                      locationId: data.id,
                    },
                  },
                },
              },
            ],
          });
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
