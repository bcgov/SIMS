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

<script lang="ts">
import { useAuth } from "@/composables";
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    subtitle: {
      type: String,
      required: true,
    },
  },
  emits: ["click"],
  setup(_props, context) {
    const { executeLogout } = useAuth();
    const logoClick = () => {
      context.emit("click");
    };
    return {
      executeLogout,
      logoClick,
    };
  },
});
</script>
