<template>
  <full-page-container layout-template="centered">
    <formio formName="studentaccountactivity"></formio>
  </full-page-container>
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
