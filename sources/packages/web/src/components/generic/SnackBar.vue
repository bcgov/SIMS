<template>
  <v-snackbar
    v-model="snackBarChoices.show"
    variant="text"
    :color="snackBarChoices.type"
    location="top right"
    :timeout="snackBarChoices.displayTime"
    :class="snackBarClass"
    class="mr-8"
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
        <v-col class="label-bold black-color">{{
          snackBarChoices.content
        }}</v-col>
      </v-row>
    </div>
    <template v-slot:actions>
      <v-icon
        icon="fa:fa fa-close"
        size="23"
        class="black-color"
        @click="snackBarChoices.show = false"
      ></v-icon>
    </template>
  </v-snackbar>
</template>
<script lang="ts">
import { computed, reactive, watch, defineComponent, PropType } from "vue";
import { SnackBarOptions, SnackBarType } from "@/types";
import { useSnackBar } from "@/composables";

export default defineComponent({
  props: {
    snackBarOptions: {
      type: Object as PropType<SnackBarOptions>,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const snackBarChoices = reactive(
      (props.snackBarOptions as SnackBarOptions) ??
        ({
          show: false,
          displayTime: snackBar.DEFAULT_MESSAGE_DISPLAY_TIME,
        } as SnackBarOptions),
    );

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
        snackBarChoices.show = props.snackBarOptions.show;
        snackBarChoices.type = props.snackBarOptions.type;
        snackBarChoices.content = props.snackBarOptions.content;
        snackBarChoices.displayTime = props.snackBarOptions.displayTime;
      },
      { immediate: true },
    );

    return {
      snackBarClass,
      snackBarIcon,
      snackBarChoices,
    };
  },
});
</script>
