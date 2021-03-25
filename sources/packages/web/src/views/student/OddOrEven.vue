<template>
  <Card class="p-m-4">
    <template #title>
      Odd or Even Form IO Integration Test
    </template>
    <template #content>
      <formio formName="odd-or-even" @submitted="submitted"></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import formio from "../../components/generic/formio.vue";
import ApiClient from "../../services/http/ApiClient";

export default {
  components: { formio },
  setup() {
    const submitted = async (args: any) => {
      await ApiClient.Workflow.startWorkflow("odd-even", {
        variables: {
          value1: {
            value: args.value1,
            type: "integer",
          },
        },
      });
    };

    return { submitted };
  },
};
</script>
