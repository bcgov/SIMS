<template>
  <v-card max-width="730" elevation="2" class="mx-auto mt-15 p-3">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="8" order="1" class="text-center text-md-left">
          <h1 class="category-header-large primary-color">Access denied</h1>
          <p class="mb-5">You don't have permission to view this page.</p>
          <p>
            If you think this is an error, try returning to the home page or
            contact support.
          </p>
        </v-col>
        <v-col
          cols="12"
          md="4"
          order="2"
          class="d-flex justify-center align-center"
        >
          <v-img
            width="260"
            height="260"
            class="mt-md-8"
            alt="An illustration of an astronaut lost in space."
            :src="illustration"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import illustration from "../assets/images/lost-in-space.svg";
</script>
