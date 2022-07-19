<template>
  <v-app>
    <snack-bar :snackBarOptions="snackBarOptions" />
    <router-view></router-view>
  </v-app>
</template>
<script lang="ts">
import SnackBar from "@/components/generic/SnackBar.vue";
import { SnackBarOptions } from "./types";
import { ref, onMounted } from "vue";
import useEmitter from "./composables/useEmitter";

export default {
  components: { SnackBar },
  setup() {
    const emitter = useEmitter();
    const snackBarOptions = ref({} as SnackBarOptions);

    onMounted(() => {
      emitter.on("snackBar", (snackBarOptionsObject: SnackBarOptions) => {
        snackBarOptions.value = snackBarOptionsObject;
      });
    });
    return { snackBarOptions };
  },
};
</script>
