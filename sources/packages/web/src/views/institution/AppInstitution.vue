<template>
  <div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-class-component";

export default class AppInstitution extends Vue {
  created() {
    console.log("App Institution created");
  }
}
</script>
