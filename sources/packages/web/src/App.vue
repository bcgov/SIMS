<template>
  <v-app>
    <!-- TODO: Find a proper solution of position styling-->
    <v-main style="position: auto">
      <Toast />
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts">
export default {};
</script>

<style lang="scss" scoped>
.auto-pos {
  position: auto;
}
</style>
