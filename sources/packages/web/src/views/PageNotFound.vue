<template>
  <v-card elevation="2" class="mx-auto mt-15 p-3">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="8" order="1" class="text-center text-md-left">
          <h1 class="category-header-large primary-color">Error 404</h1>
          <p class="mb-5">We couldn't find the webpage.</p>
          <p>Try refreshing the page or check the webpage URL for typos.</p>
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
            alt="An illustration of a 404 error."
            :src="illustration"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import illustration from "../assets/images/404.svg";
</script>
