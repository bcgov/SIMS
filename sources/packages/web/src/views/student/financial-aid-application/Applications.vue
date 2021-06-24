<template>
  <div class="p-m-4">
    <h2>Applications</h2>
  </div>
  <v-btn
    color="primary"
    class="p-button-raised"
    @click="
      $router.push({ name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM })
    "
  >
    <v-icon size="25" class="mr-2">mdi-text-box-plus</v-icon>
    Start New Application
  </v-btn>
</template>
<script lang="ts">
import { StudentRoutesConst } from "../../../constants/routes/RouteConstants";
export default {
  setup() {
    return { StudentRoutesConst };
  },
};
</script>
