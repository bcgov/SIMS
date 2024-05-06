<template>
  <v-navigation-drawer app permanent color="default">
    <v-list
      density="compact"
      bg-color="default"
      color="primary"
      class="sidebar-item no-wrap"
      active-class="active-list-item"
      :items="items"
      data-cy="sideBarMenu"
    >
    </v-list
    ><template #append>
      <v-list
        density="compact"
        nav
        class="sidebar-item no-wrap"
        active-class="active-list-item"
        bg-color="default"
        color="primary"
        :items="sidebarBottomItems"
        data-cy="sidebarBottomMenu"
      >
      </v-list
    ></template>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel } from "@/types";
import { useInstitutionAuth } from "@/composables";

export default defineComponent({
  components: {},
  setup() {
    const { isBCPublic } = useInstitutionAuth();
    const items = ref<MenuItemModel[]>([
      {
        title: "Manage Profile",
        props: {
          prependIcon: "fa:far fa-address-card-o",
          to: {
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
          },
        },
      },
      {
        title: "Manage Locations",
        props: {
          prependIcon: "fa:far fa-compass",
          to: {
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          },
        },
      },
      {
        title: "Manage Designation",
        props: {
          prependIcon: "fa:far fa-bookmark-o",
          to: {
            name: InstitutionRoutesConst.MANAGE_DESIGNATION,
          },
        },
      },
      {
        title: "Manage Users",
        props: {
          prependIcon: "fa:far fa-user-o",
          to: {
            name: InstitutionRoutesConst.MANAGE_USERS,
          },
        },
      },
    ]);
    const sidebarBottomItems = ref<MenuItemModel[]>([
      {
        title: "Offerings Upload",
        props: {
          prependIcon: "fa:fa-solid fa-upload",
          to: {
            name: InstitutionRoutesConst.OFFERINGS_UPLOAD,
          },
        },
      },
    ]);
    if (isBCPublic.value) {
      sidebarBottomItems.value.push({
        title: "Withdrawal Upload",
        props: {
          prependIcon: "fa:fa-solid fa-upload",
          to: {
            name: InstitutionRoutesConst.WITHDRAWAL_UPLOAD,
          },
        },
      });
      sidebarBottomItems.value.push({
        title: "Reports",
        props: {
          prependIcon: "fa:fa-regular fa-copy",
          to: {
            name: InstitutionRoutesConst.REPORTS,
          },
        },
      });
    }

    return {
      items,
      sidebarBottomItems,
      InstitutionRoutesConst,
    };
  },
});
</script>
