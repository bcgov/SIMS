<template>
  <student-page-container :layout-template="LayoutTemplates.CenteredTab">
    <template #header>
      <header-navigator title="Student" sub-title="Student Forms" />
    </template>
    <template #tab-header>
      <v-tabs color="primary" stacked grow>
        <v-tab
          class="label-bold"
          prepend-icon="mdi-scale-balance"
          text="Submissions"
          :to="{
            name: StudentRoutesConst.STUDENT_FORMS_SELECTOR,
            params: applicationId ? { applicationId } : undefined,
          }"
          value="form-selector"
        />
        <v-tab
          class="label-bold"
          prepend-icon="mdi-history"
          text="History"
          :to="{
            name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
            params: applicationId ? { applicationId } : undefined,
          }"
          value="form-history"
        />
      </v-tabs>
    </template>
    <div class="pt-4">
      <router-view />
    </div>
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { LayoutTemplates } from "@/types";

export default defineComponent({
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup() {
    return {
      StudentRoutesConst,
      LayoutTemplates,
    };
  },
});
</script>
