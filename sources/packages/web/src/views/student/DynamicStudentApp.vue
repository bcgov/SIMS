<template>
  <Card class="p-m-4">
    <template #title
      >Dynamically Created Financial Aid Application Form</template
    >
    <template #content>
      <formio
        formName="sfaa2122"
        @changed="changed"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import formio from "../../components/generic/formio.vue";
import ApiClient from "../../services/http/ApiClient";

export default {
  components: { formio },
  setup() {
    const changed = (form: any, event: any) => {
      if (
        event.changed &&
        event.changed.component.key === "selectInstitution" &&
        event.changed.value
      ) {
        console.log("selectInstitution");
        const submision = { data: event.data };

        if (event.changed.value === "camosun") {
          submision.data.programs = [
            { label: "Camosun - Program 1" },
            { label: "Camosun - Program 2" },
          ];
        } else if (event.changed.value === "uvic") {
          submision.data.programs = [
            { label: "UVIC - Program 1" },
            { label: "UVIC - Program 2" },
          ];
        } else if (event.changed.value === "ubc") {
          submision.data.programs = [
            { label: "UBC - Program 1" },
            { label: "UBC - Program 2" },
            { label: "UBC - Program 3" },
            { label: "UBC - Program 4" },
          ];
        }

        form.submission = submision;
      }
    };

    const submitted = async (args: any) => {
      if (!args.workflowName) {
        throw new Error("Workflow not defined.");
      }

      const payload = { variables: {} };
      const variables = Object.entries(args).map((entry) => {
        const [key, formValue] = entry;
        const newVariableValue = {
          value: String(formValue),
          type: "string",
        };
        return [key, newVariableValue];
      });

      payload.variables = Object.fromEntries(variables);
      await ApiClient.Workflow.startWorkflow(args.workflowName, payload);
    };

    return { changed, submitted };
  },
};
</script>
