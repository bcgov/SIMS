<template>
  <v-card max-width="730" elevation="2" class="mx-auto mt-15 p-3">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="9" order="1" class="text-center text-md-left">
          <h1 class="category-header-large primary-color">
            Service temporarily unavailable
          </h1>
          <p class="mb-5">We're performing maintenance.</p>
          <p class="mb-3">
            The Student Information Management System is currently unavailable
            for maintenance. Please try again later.
          </p>
          <p>
            We apologize for the inconvenience and appreciate your patience.
          </p>
        </v-col>
        <v-col
          cols="12"
          md="3"
          order="2"
          class="d-flex justify-center align-center"
        >
          <v-img
            width="260"
            height="260"
            class="mt-md-8"
            alt="An illustration of two people holding an unplugged cord. Illustration by storyset."
            :src="illustration"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import illustration from "../assets/images/person-unplugged.svg";
</script>
