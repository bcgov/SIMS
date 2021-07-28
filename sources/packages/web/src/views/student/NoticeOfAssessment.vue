<template>
  <Card class="p-m-4">
    <template #content>
      <formio formName="noticeofassessment" :data="initialData"></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import formio from "../../components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { ApplicationService } from "../../services/ApplicationService";

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
    const initialData = ref({});
    onMounted(async () => {
      initialData.value = await ApplicationService.shared.getNOA(
        props.applicationId,
      );
    });
    return {
      initialData,
    };
  },
};
</script>
