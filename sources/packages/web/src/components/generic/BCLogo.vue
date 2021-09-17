<template>
  <span>
    <v-img
      @click="logoClick"
      class="ml-5"
      width="57px"
      height="40px"
      alt="logo"
      src="../../assets/images/bc_gov_logo_header.svg"
    />
  </span>
  <v-container class="p-0 ml-2" @click="logoClick">
    <v-row class="logo-main-text" no-gutters>
      <v-col>StudentAid BC</v-col>
    </v-row>
    <v-row class="logo-subtitle" no-gutters
      ><v-col>{{ subtitle }}</v-col></v-row
    >
  </v-container>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { SetupContext } from "vue";
export default {
  props: {
    subtitle: {
      type: String,
      required: true,
    },
  },
  emits: ["click"],
  setup(_props: any, context: SetupContext) {
    const { executeLogout } = useAuth();
    const logoClick = () => {
      context.emit("click");
    };
    return {
      executeLogout,
      logoClick,
    };
  },
};
</script>
