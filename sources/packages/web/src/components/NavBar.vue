<template>
  <Menubar :model="items" class="gov-header">
    <template #start>
      <div class="p-menubar-start">
        <img alt="logo" src="../assets/images/bc_logo.svg" height="40" />
        <span class="title">Student Aid</span>
      </div>
    </template>
  </Menubar>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  components: {}
})
export default class NavBar extends Vue {
  items = [];
}
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
