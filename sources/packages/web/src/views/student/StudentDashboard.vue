<template>
  <v-container>
    <formio formName="studentdashboard"></formio>
  </v-container>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { computed } from "vue";
import { useStore } from "vuex";
import formio from "@/components/generic/formio.vue";
export default {
  components: { formio },
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
