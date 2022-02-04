<template>
  <slot name="title">
    <div v-if="!routeName" class="form-header-title">{{ title }}</div>
    <div v-if="routeName" class="form-header-title">
      <a @click="goBack(routeName, routeParams)">
        <v-icon left> mdi-arrow-left </v-icon> {{ title }}</a
      >
    </div>
  </slot>
  <v-row>
    <v-col>
      <slot name="subTitle">
        <div class="form-header-sub-title">
          {{ subTitle }}
        </div>
      </slot>
    </v-col>
    <v-col>
      <div class="float-right ml-2 form-header-button">
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
    routeName: {
      type: Symbol,
    },
    routeParams: {
      type: Object,
    },
  },

  setup() {
    const router = useRouter();

    const goBack = (routeName: symbol, routeParams: any) => {
      if (routeParams) {
        router.push({
          name: routeName,
          params: routeParams,
        });
      } else {
        router.push({
          name: routeName,
        });
      }
    };
    return { goBack };
  },
};
</script>
