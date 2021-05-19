<template>
<v-app>
  <v-navigation-drawer app>
    <ManageInstitutionSidebar v-if="store.state.institution.showManageInstitution"/>
    <HomeSideBar v-if="store.state.institution.showHome"/>
  </v-navigation-drawer>
  <div>
    <v-container fluid tag="div">
        <router-view></router-view>
    </v-container>
  </div>
</v-app>
</template>
<script>
import { useStore } from "vuex";
import ManageInstitutionSidebar from "./institution/ManageInstitutionSideBar.vue";
import HomeSideBar from "./institution/HomeSideBar.vue"

export default {
  name: "FullLayout",
  components: {
    ManageInstitutionSidebar,
    HomeSideBar
  },
  setup () {
    const store = useStore();
    return {
      store
    }
  }
};
</script>

<style>
.v-container--fluid {
    max-width: 86% !important;
    margin-left: 258px !important;
}
</style>