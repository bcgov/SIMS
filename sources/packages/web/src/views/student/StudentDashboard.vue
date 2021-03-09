<template>
  <div class="p-m-4">
    <h1>Student Dashboard</h1>
  </div>
  <Card class="p-m-4">
    <template #title>
      Welcome {{ user.givenNames }}, let's get started
    </template>
    <template #content> Please start your Financial Aid application </template>
    <template #footer>
      <Button
        label="Start Application"
        class="p-button-raised"
        @click="$router.push({ name: financialAidApplicationPath })"
      />
    </template>
  </Card>
</template>
<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { routeConstants } from "../../constants/routes/RouteConstants";

export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    const financialAidApplicationPath = routeConstants.FINANCIALAIDAPPLICATION;

    return {
      user,
      financialAidApplicationPath,
    };
  },
};
</script>
