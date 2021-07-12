<template>
  <div class="p-m-4">
    <h1>Program Year Selection</h1>
  </div>
  <Card class="p-m-4">
    <template #title>
      When will you be going to School?
    </template>
    <template #content> Select Program Year </template>
    <template #footer>
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
  </Card>
</template>
<script lang="ts">
import { StudentService } from "@/services/StudentService";
import { onMounted, ref } from "vue";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
export default {
  props: {
    formName: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref();
    onMounted(async () => {
      initialData.value = await StudentService.shared.getProgramYears();
    });
    return {
      StudentRoutesConst,
      initialData,
    };
  },
};
</script>
