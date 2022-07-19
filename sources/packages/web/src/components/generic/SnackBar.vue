<template>
  <v-snackbar
    v-model="showSnackBar"
    variant="text"
    :color="snackBarType"
    location="top right"
    timeout="20000"
    :class="snackBarClass"
    class="mt-16"
  >
    <span
      ><v-icon :icon="snackBarIcon" class="mr-2 icon-color"></v-icon
      ><span class="label-bold default-text ml-2">{{
        snackBarContent
      }}</span></span
    >
    <template v-slot:actions>
      <v-icon
        icon="fa:fa fa-close"
        @click="showSnackBar = false"
        class="mr-2"
      ></v-icon>
    </template>
  </v-snackbar>
</template>
<script lang="ts">
import { computed, ref, watch } from "vue";
import { SnackBarOptions, SnackBarType } from "@/types";

export default {
  props: {
    snackBarOptions: {
      type: Object,
      required: true,

      default() {
        return {} as SnackBarOptions;
      },
    },
  },
  setup(props: any) {
    const showSnackBar = ref(props.snackBarOptions?.show ?? false);
    const snackBarType = ref(props.snackBarOptions?.type ?? "");
    const snackBarContent = ref(props.snackBarOptions?.content);
    const snackBarClass = computed(() => {
      switch (props.snackBarOptions.type) {
        case SnackBarType.success:
          return "snackbar-success";
        case SnackBarType.error:
          return "snackbar-error";
        case SnackBarType.warn:
          return "snackbar-warn";
        default:
          return "snackbar-error";
      }
    });

    const snackBarIcon = computed(() => {
      switch (props.snackBarOptions.type) {
        case SnackBarType.success:
          return "fa:fa fa-circle-check";
        case SnackBarType.error:
          return "fa:fa fa-circle-exclamation";
        // todo: ann check with lynn
        case SnackBarType.warn:
          return "fa:fa fa-circle-waiting";
        default:
          return "fa:fa fa-circle-exclamation";
      }
    });

    watch(
      () => props.snackBarOptions,
      () => {
        showSnackBar.value = props.snackBarOptions.show;
        snackBarType.value = props.snackBarOptions.type;
        snackBarContent.value = props.snackBarOptions.content;
      },
      { immediate: true },
    );

    return {
      showSnackBar,
      snackBarType,
      snackBarContent,
      snackBarClass,
      snackBarIcon,
    };
  },
};
</script>
