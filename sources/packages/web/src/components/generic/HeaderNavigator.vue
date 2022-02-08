<template>
  <slot name="title">
    <div v-if="routeLocation" class="header-title">
      <a @click="goBack()">
        <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
        {{ title }}</a
      >
    </div>
    <div v-else class="header-title">
      {{ title }}
    </div>
  </slot>
  <v-row>
    <v-col>
      <slot name="subTitle">
        <div class="header-sub-title">
          {{ subTitle }}
        </div>
      </slot>
    </v-col>
    <v-col>
      <div class="float-right ml-2 header-button">
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
