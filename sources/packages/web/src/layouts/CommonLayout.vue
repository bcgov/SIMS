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
</style>