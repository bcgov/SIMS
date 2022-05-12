<template>
  <v-banner lines="two" :class="bannerClass">
    <v-banner-icon><slot name="icon"> </slot></v-banner-icon>

    <v-banner-text class="v-banner-content"
      ><div class="label-bold">{{ header }}</div>
      <div>{{ summary }}</div>
    </v-banner-text>

    <template v-slot:actions>
      <v-btn>Action</v-btn>
    </template>
  </v-banner>
</template>
<script lang="ts">
// import { useRouter } from "vue-router";

export default {
  props: {
    bannerClass: {
      type: String,
    },
    header: {
      type: String,
    },
    summary: {
      type: String,
    },
    routeLocation: {
      type: Object,
    },
  },

  //   setup(props: any) {
  //     const router = useRouter();

  //     const goBack = () => {
  //       router.push(props.routeLocation);
  //     };
  //     return { goBack };
  //   },
};
</script>
