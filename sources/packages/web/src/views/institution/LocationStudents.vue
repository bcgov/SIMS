<template>
  <v-container>
    <h2>{{ locationName }}</h2>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">Students</h2>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
export default {
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
  },
};
</script>
