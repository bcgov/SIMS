<template>
  <full-page-container>
    <formio formName="studentdashboard"></formio>
  </full-page-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { computed } from "vue";
import { useStore } from "vuex";
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
export default {
  components: { formio, FullPageContainer },
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
