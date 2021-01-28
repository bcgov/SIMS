<template>
  <div>
    <div :class="{ 'validation-error': property.$invalid }">
      <slot></slot>
    </div>
    <span v-if="property.$invalid">
      <ul class="validation-error-list">
        <li v-for="e in property.$errors" :key="e.$message">
          {{ e.$message }}
        </li>
      </ul>
    </span>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    property: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss">
.validation-error-list {
  list-style-type: none;
  color: red;
  padding-inline-start: 0px;
  margin-top: 5px !important;
}

.validation-error input {
  border: 2px solid red;
}
</style>
