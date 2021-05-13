<template>
  <v-app>
    <v-main style="position: auto">
      <router-view></router-view>
    </v-main>
  </v-app>
  <!-- <router-view></router-view> -->
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",

  data() {
    return {
      //
    };
  },
});
</script>

<style lang="scss" scoped>
.auto-pos {
  position: auto;
}
</style>
