<template>
  <v-alert :type="type" variant="outlined" :icon="bannerIcon">
    <template #title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <v-row>
      <v-col md="10">
        <div class="label-value-normal">
          <slot name="content">{{ summary }}</slot>
        </div>
      </v-col>
      <v-col md="2">
        <div class="float-right"><slot name="actions"></slot></div
      ></v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
import { BannerTypes } from "@/types/contracts/Banner";
import { computed } from "vue";

export default {
  props: {
    type: {
      type: String,
      validator: (val: string) => val in BannerTypes,
    },
    header: {
      type: String,
    },
    summary: {
      type: String,
    },
  },
  setup(props: any) {
    const bannerIcon = computed(() => {
      switch (props.type) {
        case BannerTypes.Success:
          return "fa:fa fa-circle-check";
        case BannerTypes.Warning:
          return "fa:fa fa-triangle-exclamation";
        case BannerTypes.Error:
          return "fa:fa fa-circle-exclamation";
        case BannerTypes.Info:
          return "fa:fa fa-circle-info";
        default:
          return "";
      }
    });
    return { bannerIcon };
  },
};
</script>
