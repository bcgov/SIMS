<template>
  <v-snackbar
    v-model="showSnackBar"
    variant="text"
    :color="snackBarType"
    location="top right"
    :timeout="snackBarTimeOut"
    :class="snackBarClass"
    class="mt-16 mr-8"
  >
    <div class="mt-2">
      <v-row>
        <v-col cols="1">
          <v-icon
            :icon="snackBarIcon"
            class="icon-color mt-0"
            size="23"
          ></v-icon>
        </v-col>
        <v-col class="label-bold default-color">{{ snackBarContent }}</v-col>
      </v-row>
    </div>
    <template v-slot:actions>
      <v-icon
        icon="fa:fa fa-close"
        size="23"
        class="default-color"
        @click="showSnackBar = false"
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
    const snackBarTimeOut = ref(props.snackBarOptions?.displayTime ?? 5000);
    const snackBarClass = computed(() => {
      switch (props.snackBarOptions.type) {
        case SnackBarType.success:
          return "snackbar-success";
        case SnackBarType.error:
          return "snackbar-error";
        case SnackBarType.warn:
          return "snackbar-warn";
        default:
          return "";
      }
    });

    const snackBarIcon = computed(() => {
      switch (props.snackBarOptions.type) {
        case SnackBarType.success:
          return "fa:fa fa-circle-check";
        case SnackBarType.error:
          return "fa:fa fa-circle-exclamation";
        case SnackBarType.warn:
          return "fa:fa fa-clock";
        default:
          return "";
      }
    });

    watch(
      () => props.snackBarOptions,
      () => {
        showSnackBar.value = props.snackBarOptions.show;
        snackBarType.value = props.snackBarOptions.type;
        snackBarContent.value = props.snackBarOptions.content;
        snackBarTimeOut.value = props.snackBarOptions.displayTime;
      },
      { immediate: true },
    );

    return {
      showSnackBar,
      snackBarType,
      snackBarContent,
      snackBarClass,
      snackBarIcon,
      snackBarTimeOut,
    };
  },
};
</script>
