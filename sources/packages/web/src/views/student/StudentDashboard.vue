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
      <v-btn
        color="primary"
        class="p-button-raised"
        @click="$router.push({ name: StudentRoutesConst.PROGRAM_YEARS })"
      >
        <v-icon size="25" class="mr-2">mdi-text-box-plus</v-icon>
        Start New Application
      </v-btn>
    </template>
  </Card>
</template>
<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";

export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);

    return {
      user,
      StudentRoutesConst,
    };
  },
};
</script>
