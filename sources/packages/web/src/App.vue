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
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap");
body {
  font-family: "Noto Sans", sans-serif;
  font-family: Noto Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0px;
  text-align: left;
  color: #4f4f4f;
}

.bold-text {
  font-family: "Noto Sans", sans-serif;
  font-style: normal;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.2px;
  color: #2965c5;
}
</style>
