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
      <v-list density="compact" nav>
        <v-list-subheader>Locations</v-list-subheader>
        <v-list-item
          v-for="location in locationsMenu"
          :key="location.label"
          @click="location.command"
        >
          <v-list-item-content>
            <v-list-item-title
              ><v-icon>{{ location.icon }}</v-icon>
              {{ location.label }}</v-list-item-title
            >
            <v-list-item
              v-for="locationItem in location?.items"
              :key="locationItem"
              :prepend-icon="locationItem.icon"
              :title="locationItem.label"
              @click="locationItem.command"
            />
          </v-list-item-content>
        </v-list-item>
      </v-list>
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
                    icon: "mdi-account-details-outline",
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
                    label: "Report a change",
                    icon: "mdi-account-tie-outline",
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
                  {
                    label: "Program Info Requests",
                    icon: "mdi-account-tie-outline",
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
                    label: "Confirmation of Enrollment",
                    icon: "mdi-account-tie-outline",
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
    };
  },
};
</script>
