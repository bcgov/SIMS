<template>
  <v-row>
    <v-card elevation="2" class="mx-auto mt-15" max-width="400px" outlined>
      <v-card-header>
        <v-card-header-text>
          <v-card-title class="bold-text">I am a parent</v-card-title>
        </v-card-header-text>
      </v-card-header>
      <v-card-text
        >I am a parent and need to complete supporting information for my
        dependent.</v-card-text
      >
      <v-divider></v-divider>
      <v-card-actions>
        <v-row justify="center" class="mb-2">
          <v-btn color="primary">
            <v-icon size="25" class="mr-2">mdi-account-star-outline</v-icon>
            Start Parent Information Request
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>

    <v-card elevation="2" class="mx-auto mt-15" max-width="400px" outlined>
      <v-card-header>
        <v-card-header-text>
          <v-card-title class="bold-text">I am a partner</v-card-title>
        </v-card-header-text>
      </v-card-header>
      <v-card-text
        >I am a partner and need to complete supporting information for my
        partner.</v-card-text
      >
      <v-divider></v-divider>
      <v-card-actions>
        <v-row justify="center" class="mb-2">
          <v-btn color="primary">
            <v-icon size="25" class="mr-2">mdi-account-star-outline</v-icon>
            Start Partner Information Request
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-row>
</template>

<script lang="ts">
export default {};
</script>
