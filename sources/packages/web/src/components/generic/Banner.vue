<template>
  <v-banner lines="two" :class="bannerClass">
    <v-banner-icon><slot name="icon"> </slot></v-banner-icon>

    <v-banner-text :style="{ display: 'block' }"
      ><div class="label-bold">{{ header }}</div>
      <div>{{ summary }}</div>
    </v-banner-text>

    <slot name="actions"> </slot>
  </v-banner>
</template>
<script lang="ts">
export default {
  props: {
    buttonLabel: {
      type: String,
    },
    buttonClass: {
      type: String,
    },
    bannerClass: {
      type: String,
    },
    header: {
      type: String,
    },
    summary: {
      type: String,
    },
    // routeLocation: {
    //   type: Object,
    // },
  },

  // setup(props: any) {
  //   const router = useRouter();

  //   const navigate = () => {
  //     router.push(props.routeLocation);
  //   };
  //   return { navigate };
  // },
};
</script>
