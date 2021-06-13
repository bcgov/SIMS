<template>
  <v-container>
    <h1 class="d-flex justify-content-center">Dashboard Work in Progress</h1>
  </v-container>
</template>

<script lang="ts">
import { useStore } from "vuex";

export default {
  setup() {
    const store = useStore();
    return { store };
  },
};
</script>

<style></style>
