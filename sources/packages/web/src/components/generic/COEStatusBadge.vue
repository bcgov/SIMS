<!--
COE Status Badge
-->
<template>
  <v-badge :color="backGroundColor" :text-color="textColor" :class="badgeClass">
    <template v-slot:badge>
      <font-awesome-icon
        :icon="['fas', 'circle']"
        class="mr-1"
        :color="iconColor"
      />
      <span class="text-uppercase">{{ status }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { ref, onMounted, watch } from "vue";
import { COEStatus } from "@/types";
import {
  COLOR_BLACK,
  COLOR_WHITE,
  COLOR_BANNER_SUCCESS,
  COLOR_BANNER_WARNING,
  COLOR_BANNER_ERROR,
} from "@/constants";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const badgeClass = ref("");
    const textColor = ref(COLOR_BLACK);
    const backGroundColor = ref(COLOR_WHITE);
    const iconColor = ref("");

    const setStyles = () => {
      switch (props.status) {
        case COEStatus.completed:
          badgeClass.value = "status-badge-success";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BANNER_SUCCESS;
          break;
        case COEStatus.declined:
          badgeClass.value = "status-badge-error";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BANNER_ERROR;
          break;
        case COEStatus.required:
          badgeClass.value = "status-badge-warning";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BANNER_WARNING;
          break;
      }
    };
    watch(
      () => props.status,
      () => {
        setStyles();
      },
    );

    onMounted(() => {
      setStyles();
    });

    return {
      badgeClass,
      textColor,
      backGroundColor,
      iconColor,
    };
  },
};
</script>
