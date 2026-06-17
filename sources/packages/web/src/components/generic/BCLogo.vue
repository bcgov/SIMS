<template>
  <span>
    <v-img
      @click="logoClick"
      class="ml-5"
      width="57px"
      height="40px"
      src="../../assets/images/bc_gov_logo_header.svg"
      alt="StudentAid BC logo"
    />
  </span>
  <v-container class="p-0 ml-2" @click="logoClick">
    <v-row class="logo-main-text" no-gutters>
      <v-col>StudentAid BC</v-col>
    </v-row>
    <v-row class="logo-subtitle hidden-xs" no-gutters
      ><v-col>{{ subtitle }}</v-col></v-row
    >
  </v-container>
</template>

<script setup lang="ts">
interface Props {
  subtitle: string;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const logoClick = () => {
  emit("click");
};
</script>
