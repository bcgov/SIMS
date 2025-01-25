<template>
  <v-app>
    <environment-banner />
    <snack-bar :snackBarOptions="snackBarOptions" />
    <router-view></router-view>
  </v-app>
</template>
<script lang="ts">
import SnackBar from "@/components/generic/SnackBar.vue";
import { SnackBarOptions } from "@/types";
import { ref, defineComponent } from "vue";
import useEmitter from "@/composables/useEmitter";
import EnvironmentBanner from "@/components/common/EnvironmentBanner.vue";

export default defineComponent({
  components: {
    SnackBar,
    EnvironmentBanner,
  },
  setup() {
    const emitter = useEmitter();
    const snackBarOptions = ref({} as SnackBarOptions);
    emitter.on("snackBar", (snackBarOptionsObject?: SnackBarOptions) => {
      snackBarOptions.value = snackBarOptionsObject ?? ({} as SnackBarOptions);
    });
    return { snackBarOptions };
  },
});
</script>
