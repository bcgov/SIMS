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
      await ApplicationService.shared.confirmationOfAssessment(
        props.applicationId,
      );
      toast.success(
        "Completed!",
        "Confirmation of Assessment completed successfully!",
      );
    };
    onMounted(async () => {
      const NOA = await ApplicationService.shared.getNOA(props.applicationId);
      initialData.value = NOA.assessment;
    });
    return {
      initialData,
      confirmAssessment,
    };
  },
};
</script>
