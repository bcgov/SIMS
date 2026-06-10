<template>
  <v-card elevation="2" class="mx-auto mt-12" max-width="670px" outlined>
    <v-card-text>
      <template v-if="isMobile">
        <v-row no-gutters>
          <v-col md="9">
            <h1 class="category-header-large primary-color">
              {{ props.title }}
            </h1>
            <p class="my-2">
              <slot name="subtitle">{{ props.subtitle }}</slot>
            </p>
          </v-col>
          <v-col><slot name="image" /></v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <content-group>
              <h2 class="category-header-medium primary-color mb-2">
                {{ props.loginAreaTitle }}
              </h2>
              <p>{{ props.loginAreaText }}</p>
              <v-btn
                class="mt-4"
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                {{ props.loginAreaButton }}
              </v-btn>
            </content-group>
          </v-col>
        </v-row>
      </template>
      <template v-else>
        <v-row no-gutters>
          <v-col md="9">
            <h1 class="category-header-large primary-color">
              {{ props.title }}
            </h1>
            <p class="my-2">
              <slot name="subtitle">{{ props.subtitle }}</slot>
            </p>
            <content-group>
              <h2 class="category-header-medium primary-color mb-2">
                {{ props.loginAreaTitle }}
              </h2>
              <p>{{ props.loginAreaText }}</p>
              <v-btn
                class="mt-4"
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                {{ props.loginAreaButton }}
              </v-btn>
            </content-group>
          </v-col>
          <v-col cols="3" align-self="end"><slot name="image" /></v-col>
        </v-row>
      </template>
      <v-row>
        <v-col cols="12">
          <slot name="banner-message" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

const { smAndDown: isMobile } = useDisplay();

const props = defineProps<{
  title: string;
  subtitle: string;
  loginAreaTitle: string;
  loginAreaText: string;
  loginAreaButton: string;
}>();

const emit = defineEmits<{
  (e: "login"): void;
}>();

const login = async () => {
  emit("login");
};
</script>
