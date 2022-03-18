<template>
  <v-container>
    <!-- header area -->
    <div class="mb-4">
      <header-navigator title="Student" subTitle="Request a Change" />
    </div>
    <full-page-container>
      <!-- content area -->
      <div>
        <formio formName="studentrequestchange"></formio>
      </div>
      <!-- action area -->
      <div class="mt-4">
        <v-btn class="primary-btn-background float-right">Next</v-btn>
      </div>
    </full-page-container>
  </v-container>
</template>
<script lang="ts">
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
export default {
  components: { HeaderNavigator, FullPageContainer, formio },
};
</script>
