<template>
  <v-container>
    <formio formName="institutionwelcomepage"></formio>
  </v-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
export default {
  components: { formio },
};
</script>

<style>
.img-welcome-background {
  background-image: url("../../assets/images/image_institution_welcome.svg");
  background-repeat: no-repeat;
  background-size: contain;
  width: 100%;
  height: 100%;
  min-height: 250px;
}

.img-active-support-background {
  background-image: url("../../assets/images/image_active_support.svg");
  background-repeat: no-repeat;
  background-size: contain;
  width: 100%;
  height: 100%;
  min-height: 150px;
}
</style>
