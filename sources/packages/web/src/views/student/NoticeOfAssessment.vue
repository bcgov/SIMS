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
import ApiClient from "../../services/http/ApiClient";

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
      initialData.value = await ApiClient.Application.getNOA(
        props.applicationId,
      );
    });
    return {
      initialData,
    };
  },
};
</script>

<style></style>
