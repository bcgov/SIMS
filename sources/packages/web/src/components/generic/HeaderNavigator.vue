<template>
  <v-row align="end" class="mb-1">
    <v-col>
      <slot name="title">
        <div v-if="routeLocation" class="header-title">
          <a @click="goBack()">
            <v-icon icon="fa:fa fa-arrow-left" size="25"></v-icon>
            {{ title }}</a
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
import { useRouter } from "vue-router";

export default {
  props: {
    title: {
      type: String,
    },
    subTitle: {
      type: String,
    },
    routeLocation: {
      type: Object,
    },
  },

  setup(props: any) {
    const router = useRouter();

    const goBack = () => {
      router.push(props.routeLocation);
    };
    return { goBack };
  },
};
</script>
