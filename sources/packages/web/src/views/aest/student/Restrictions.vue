<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <p class="category-header-large color-blue">Restrictions</p>
    </div>
  </v-card>
</template>

<script lang="ts">
export default {
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
};
</script>
