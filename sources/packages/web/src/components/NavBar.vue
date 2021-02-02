<template>
  <Menubar :model="menuItems" class="gov-header">
    <template #start>
      <div class="p-menubar-start">
        <img alt="logo" src="../assets/images/bc_logo.svg" height="40" />
        <span class="title">Student Aid</span>
      </div>
    </template>
    <template #end>
      <Button label="Student Profile" icon="pi pi-fw pi-user" class="p-button-text" style="color: white" @click="$router.push('/student/edit')" />
    </template>
  </Menubar>
</template>

<script lang="ts">
export default {
  setup() {
    const menuItems:any = [];
    return { menuItems };
  }
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
