<template>
  <v-alert
    :type="props.type"
    variant="outlined"
    :icon="bannerIcon"
    class="sims-banner"
  >
    <template #title>
      <div class="label-bold-normal">{{ props.header }}</div>
    </template>
    <v-row>
      <v-col>
        <div class="label-value-normal">
          <slot name="content">{{ props.summary }}</slot>
          <slot name="content-list" v-if="props.summaryList">
            <ul class="list-indent-compact">
              <li v-for="(item, index) in props.summaryList" :key="index">
                {{ item }}
              </li>
            </ul>
          </slot>
        </div>
      </v-col>
      <v-col cols="auto"> <slot name="actions"></slot></v-col>
    </v-row>
  </v-alert>
</template>
<script setup lang="ts">
import { BannerTypes } from "@/types/contracts/Banner";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    type: BannerTypes;
    header?: string;
    summary?: string;
    summaryList?: string[];
  }>(),
  {
    header: undefined,
    summary: undefined,
    summaryList: undefined,
  },
);

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
</script>
