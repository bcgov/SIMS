<template>
  <slot name="title">
    <div class="form-header-title">{{ title }}</div>
  </slot>
  <slot name="navigationLink"></slot>
  <slot name="subTitle">
    <div class="form-header-sub-title">
      <strong>{{ subTitle }}</strong>
    </div>
  </slot>
  <slot name="secondaryButton"></slot>
  <slot name="primaryButton"></slot>
  <slot name="menuButton"></slot>
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
