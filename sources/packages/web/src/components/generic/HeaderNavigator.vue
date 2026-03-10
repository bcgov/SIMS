<template>
  <v-row align="end" class="mb-1 user-select-none">
    <v-col>
      <slot name="title">
        <div v-if="routeLocation || backTarget" class="header-title">
          <a @click="goBack()" class="header-title-link">
            <v-icon icon="fa:fa fa-arrow-left" size="25"></v-icon>
            {{ backTarget?.name ?? title }}</a
          >
        </div>
        <div v-else class="header-title">
          {{ title }}
        </div>
      </slot>
      <span class="float-left">
        <slot name="subTitle">
          <div class="header-sub-title">
            {{ subTitle }}
          </div>
        </slot>
      </span>
      <span class="float-left">
        <slot name="sub-title-details"></slot>
      </span>
    </v-col>
    <v-col>
      <div class="float-right header-button">
        <slot name="buttons"> </slot>
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { BackTarget } from "@/types";
import { defineComponent, PropType } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";

export default defineComponent({
  props: {
    title: {
      type: String,
      required: false,
      default: undefined,
    },
    subTitle: {
      type: String,
      required: false,
      default: undefined,
    },
    routeLocation: {
      type: Object as PropType<RouteLocationRaw>,
      required: false,
      default: undefined,
    },
    /**
     * Provides alternative route and title.
     * If provided, it will take precedence over the
     * properties title and routeLocation.
     */
    backTarget: {
      type: Object as PropType<BackTarget>,
      required: false,
      default: undefined,
    },
  },

  setup(props) {
    const router = useRouter();
    const goBack = () => {
      if (props.backTarget) {
        router.push(props.backTarget.to);
        return;
      }
      if (props.routeLocation) {
        router.push(props.routeLocation);
      }
    };
    return { goBack };
  },
});
</script>
