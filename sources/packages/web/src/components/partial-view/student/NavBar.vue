<template>
  <Menubar :model="menuItems" class="gov-header">
    <template #start>
      <div class="p-menubar-start">
        <v-img
          width="156.7"
          height="43.5"
          alt="logo"
          src="../../../assets/images/bc_logo.svg"
        />
        <span class="title">{{ title }}</span>
      </div>
    </template>
    <template #end>
      <slot name="end"></slot>
      <Button
        v-if="isAuthenticated"
        label="Log off"
        icon="pi pi-fw pi-power-off"
        class="p-button-text text-white"
        @click="logoff"
      />
    </template>
  </Menubar>
</template>

<script lang="ts">
import { computed } from "vue";
import { AppConfigService } from "../../../services/AppConfigService";

export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    clientType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const menuItems: any = [];
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true
    );

    const logoff = () => {
      AppConfigService.shared.logout(props.clientType);
    };

    return { menuItems, isAuthenticated, logoff };
  },
};
</script>

<style lang="scss" scoped>
.gov-header {
  border-color: rgb(0, 51, 102);
  border-bottom: 2px solid #fcba19;
  background-color: rgb(0, 51, 102);
  border-radius: 0px;
  height: 60px;

  .title {
    font-family: inherit !important;
    color: #ffffff;
    overflow: hidden;
    padding-left: 1rem;
    font-size: x-large;
  }

  .p-menubar-start {
    display: flex !important;
    align-items: center !important;
  }
}
</style>
