<template>
  <v-app>
    <v-navigation-drawer app>
      <router-view name="sidebar"></router-view>
    </v-navigation-drawer>
    <!-- TODO: added v-container instead of v-main 
    (since v-main has scrolling issue), replace 
    container with main, when vuetify3 stable
      version is relased -->
    <v-container fluid>
      <router-view :key="$route.fullPath"></router-view>
    </v-container>
  </v-app>
</template>
<script>
export default {};
</script>
<style>
/* remove the style once vuetify stable version is released - added for padding and scrolling issue */
.v-container--fluid {
  max-width: 86% !important;
  margin-left: 258px !important;
}
</style>
