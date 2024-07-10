<template>
  <v-alert
    :type="type"
    variant="outlined"
    :icon="bannerIcon"
    class="sims-banner"
  >
    <template #title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <v-row>
      <v-col>
        <div class="label-value-normal">
          <slot name="content">{{ summary }}</slot>
          <slot name="content-list" v-if="summaryList">
            <ul>
              <li v-for="item in summaryList" :key="item">
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
<script lang="ts">
import { BannerTypes } from "@/types/contracts/Banner";
import { PropType, computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    type: {
      type: String as PropType<BannerTypes>,
      required: true,
    },
    header: {
      type: String,
    },
    summary: {
      type: String,
    },
    summaryList: {
      type: Array<string>,
    },
  },
  setup(props) {
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
});
</script>
