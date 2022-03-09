<template>
  <v-row>
    <v-col md="6">
      <v-btn
        color="primary"
        v-show="!isFirstPage"
        outlined
        @click="$emit('wizardGoPrevious')"
        >Previous section</v-btn
      >
    </v-col>
    <v-col md="6" class="ml-auto text-right">
      <v-btn color="primary" v-show="!isLastPage" @click="$emit('wizardGoNext')"
        >Next section</v-btn
      >
    </v-col>
  </v-row>
</template>

<script lang="ts">
export default {
  emits: ["wizardGoNext", "wizardGoPrevious"],
  props: {
    isFirstPage: {
      type: Boolean,
      required: true,
    },
    isLastPage: {
      type: Boolean,
      required: true,
    },
  },
};
</script>
