<template>
  <Card class="p-m-4">
    <template #content>
      <formio formName="noticeofassessment" :data="initialData"></formio>
    </template>
  </Card>
  <v-btn
    color="primary"
    class="p-button-raised ml-2 float-right"
    @click="confirmAssessment()"
  >
    <v-icon size="25">mdi-text-box-plus</v-icon>
    Confirmation of Assessment
  </v-btn>
</template>

<script lang="ts">
import formio from "../../components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { ApplicationService } from "../../services/ApplicationService";
import { useToastMessage } from "@/composables";

export default {
  components: { formio },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    // Hooks
    const toast = useToastMessage();
    const initialData = ref({});
    const confirmAssessment = async () => {
      try {
        await ApplicationService.shared.confirmAssessment(props.applicationId);
        toast.success(
          "Completed!",
          "Confirmation of Assessment completed successfully!",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while confirming the assessment.",
        );
      }
    };
    onMounted(async () => {
      const NOA = await ApplicationService.shared.getNOA(props.applicationId);
      initialData.value = NOA;
    });
    return {
      initialData,
      confirmAssessment,
    };
  },
};
</script>
