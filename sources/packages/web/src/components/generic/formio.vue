<template>
  <ProgressSpinner v-if="!hideSpinner" />
  <div ref="formioContainerRef"></div>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { Formio } from "formiojs";
import { SetupContext } from "vue";
import { useToast } from "primevue/usetoast";
import ApiClient from "../../services/http/ApiClient";

export default {
  emits: ["submitted", "loaded", "changed"],
  props: {
    formName: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
    },
    draft: {
      type: Boolean,
    },
  },
  setup(props: any, context: SetupContext) {
    const formioContainerRef = ref(null);
    const hideSpinner = ref(false);
    const toast = useToast();

    onMounted(async () => {
      // Use SIMS API as a proxy to retrieve the form definition from formio.
      const formDefinition = await ApiClient.DynamicForms.getFormDefinition(
        props.formName,
      );

      const form = await Formio.createForm(
        formioContainerRef.value,
        formDefinition.data,
      );

      form.nosubmit = true;
      hideSpinner.value = true;
      if (props.data) {
        form.submission = {
          data: props.data,
        };
      } else {
        if (props.draft) {
          try {
            const draftData = await ApiClient.DynamicForms.getDraft(
              props.formName,
            );
            console.dir(draftData);
            if (draftData) {
              form.submission = {
                data: draftData.data,
              };
            }
          } catch (error) {
            console.error(error);
          }
        }
      }

      context.emit("loaded", form);

      // Triggered when any component in the form is changed.
      form.on("change", (event: any) => {
        context.emit("changed", form, event);
      });

      form.on("submit", (submision: any) => {
        context.emit("submitted", submision.data);
      });

      if (props.draft) {
        form.on("draft", async (data: any) => {
          await ApiClient.DynamicForms.saveDraft(props.formName, data);
          toast.add({
            severity: "success",
            summary: "Draft saved",
            detail: "",
            life: 3000,
          });
        });

        form.on("draft-clear", async () => {
          await ApiClient.DynamicForms.deleteDraft(props.formName);
          toast.add({
            severity: "success",
            summary: "Draft removed",
            detail: "",
            life: 3000,
          });
        });
      }
    });

    return { formioContainerRef, hideSpinner };
  },
};
</script>

<style lang="scss"></style>
