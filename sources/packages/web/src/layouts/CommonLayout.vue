<template>
  <v-app-bar app>
  <Header />
  </v-app-bar>
  <router-view></router-view>
</template>
<script>
import Header from "./common/Header.vue";
export default {
  name: "CommonLayout",
  components: {
    Header,
  }
};
</script>

<style>
.v-container--fluid {
    max-width: 86% !important;
    margin-left: 258px !important;
}
</style>