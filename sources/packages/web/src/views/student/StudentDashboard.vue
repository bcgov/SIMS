<template>
  <div class="p-m-4">
    <h1>Student Dashboard</h1>
  </div>
  <Card class="p-m-4">
    <template #title>
      Welcome {{ user.givenNames }}, let's get started
    </template>
    <template #content>
      Student Dashboard Work in Progress
    </template>
  </Card>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed } from "vue";
import { useStore } from "vuex";
export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    return {
      StudentRoutesConst,
      user,
    };
  },
};
</script>
