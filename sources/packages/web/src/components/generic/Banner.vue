<template>
  <v-alert :type="type" variant="outlined" :icon="bannerIcon">
    <template #title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <v-row>
      <v-col sm="10" md="10" lg="10"
        ><div class="label-value-normal" v-html="summary"></div>
      </v-col>
      <v-col sm="2" md="2" lg="2"><slot name="actions"></slot></v-col>
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
