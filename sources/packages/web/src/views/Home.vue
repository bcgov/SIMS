<template>
  <div style="padding-left: 10px">
    <h1>Home - Student Dashboard</h1>
  </div>
  <Card class="p-m-4">
    <template #title> Welcome {{ user.name }}, let's get started </template>
    <template #content> Please start your Financial Aid application </template>
    <template #footer>
      <Button
        label="Start Application"
        class="p-button-raised"
        @click="$router.push('/application')"
      />
    </template>
  </Card>
</template>
<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    return {
      user,
    };
  },
};
</script>
