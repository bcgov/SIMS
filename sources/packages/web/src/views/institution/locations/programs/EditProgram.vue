<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="props.backTarget.name"
        :route-location="props.backTarget.to"
        sub-title="Edit Program"
      />
    </template>
    <body-header-container title="Program information"
      ><content-group>
        <error-summary :errors="editProgramForm.errors" />
        <v-form ref="editProgramForm">
          <v-text-field
            v-model="program.name"
            density="compact"
            label="Program name"
            variant="outlined"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Program name')]"
          />
          <v-textarea
            variant="outlined"
            label="Program description"
            required
            class="mt-4"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Program description')]"
          ></v-textarea>
        </v-form>
      </content-group>
      <footer-buttons
        primary-label="Update"
        :processing="false"
        @secondary-click="cancel"
        @primary-click="submit"
        :disable-primary-button="false"
    /></body-header-container>
  </full-page-container>
</template>
<script setup lang="ts">
import { useRules } from "@/composables";
import { BackTarget, VForm } from "@/types";
import { reactive, ref } from "vue";

interface EditProgramProps {
  locationId: number;
  programId: number;
  backTarget: BackTarget;
}
const props = defineProps<EditProgramProps>();
const program = reactive<{ name?: string; description?: string }>({});
const { checkNullOrEmptyRule } = useRules();
const editProgramForm = ref({} as VForm);
const submit = async () => {
  const { valid } = await editProgramForm.value.validate();
  if (!valid) {
    return;
  }
  console.log("Program updated:", program);
};
const cancel = async () => {
  editProgramForm.value.reset();
};
</script>
