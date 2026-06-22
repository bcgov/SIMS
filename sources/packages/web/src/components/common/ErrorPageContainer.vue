<template>
  <div class="fill-height d-flex align-center justify-center">
    <v-card elevation="0">
      <v-card-text>
        <v-row density="compact">
          <v-col cols="12" md="8" class="d-flex align-center">
            <body-header-container
              :title="props.title"
              :sub-title="props.subtitle"
            >
              <slot></slot>
            </body-header-container>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-center align-center">
            <slot name="image"></slot>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  title: string;
  subtitle: string;
}>();
</script>
