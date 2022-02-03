<template>
  <slot name="title">
    <div class="form-header-title">{{ title }}</div>
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
      <slot name="buttons"> </slot>
    </v-col>
  </v-row>
</template>
<script lang="ts">
export default {
  props: {
    title: {
      type: String,
    },
    subTitle: {
      type: String,
    },
  },
};
</script>
