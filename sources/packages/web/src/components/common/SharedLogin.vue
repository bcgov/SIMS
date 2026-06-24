<template>
  <v-card elevation="2" class="mx-auto mt-12" max-width="670px" outlined>
    <v-card-text>
      <v-row no-gutters density="compact">
        <v-col cols="12" md="9">
          <body-header-container>
            <template #header>
              <body-header :title="props.title" header-size="large">
                <template #subtitle>
                  <span>
                    <slot name="subtitle">{{ props.subtitle }}</slot>
                  </span>
                </template>
              </body-header>
            </template>
            <content-group>
              <body-header-container
                :title="props.loginAreaTitle"
                :sub-title="props.loginAreaText"
                header-size="medium"
              />
              <v-btn
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                {{ props.loginAreaButton }}
              </v-btn>
            </content-group>
          </body-header-container>
        </v-col>
        <v-col cols="12" md="3" class="align-self-end"
          ><slot name="image"
        /></v-col>
      </v-row>
      <v-row v-if="$slots['banner-message']">
        <v-col cols="12">
          <slot name="banner-message" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
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
