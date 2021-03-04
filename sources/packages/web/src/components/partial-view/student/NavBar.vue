<template>
  <Menubar :model="menuItems" class="gov-header">
    <template #start>
      <div class="p-menubar-start">
        <img alt="logo" src="../assets/images/bc_logo.svg" height="40" />
        <span class="title">Student Aid</span>
      </div>
    </template>
    <template #end>
      <Button
        v-if="isAuthenticated"
        label="Student Profile"
        icon="pi pi-fw pi-user"
        class="p-button-text"
        style="color: white"
        @click="$router.push('/student-profile/edit')"
      />
      <Button
        v-if="isAuthenticated"
        label="Log off"
        icon="pi pi-fw pi-power-off"
        class="p-button-text"
        style="color: white"
        @click="logoff"
      />
    </template>
  </Menubar>
</template>

<script lang="ts">
import { computed } from "vue";
import { AppConfigService } from "../../services/AppConfigService";
export default {
  setup() {
    const menuItems: any = [];
    const isAuthenticated = computed(
      () => AppConfigService.shared.authService?.authenticated === true,
    );

    const logoff = () => {
      AppConfigService.shared.authService?.logout();
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
