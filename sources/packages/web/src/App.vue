<template>
  <v-app>
    <Toast />
    <router-view></router-view>
  </v-app>
</template>

<script lang="ts">
export default {};
</script>

<style>
html * {
  font-family: "BCSans", "Noto Sans", Verdana, Arial, sans-serif, "primeicons";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0px;
  text-align: left;
  color: #4f4f4f;
}

.bold-text {
  font-style: normal;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.2px;
  color: #2965c5;
}
</style>
