<template>
  <v-app>
    <v-main>
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
