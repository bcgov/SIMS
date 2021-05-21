<template>
  <v-app-bar app>
    <Header :isAuthenticated="isAuthenticated" />
  </v-app-bar>
  <router-view></router-view>
</template>
<script>
import Header from "../Institution/common/Header.vue";
export default {
  name: "CommonLayout",
  components: {
    Header,
  },
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
<style>
</style>