<template>
  <student-page-container :layout-template="LayoutTemplates.CenteredTab">
    <template #header>
      <header-navigator title="Student" sub-title="Student Forms" />
    </template>
    <template #tab-header>
      <v-tabs color="primary" grow>
        <v-tab
          class="label-bold"
          prepend-icon="fa:fas fa-inbox"
          text="Submissions"
          :to="{
            name: StudentRoutesConst.STUDENT_FORMS_SELECTOR,
            query: applicationId ? { applicationId } : undefined,
          }"
          value="form-selector"
        />
        <v-tab
          class="label-bold"
          prepend-icon="fa:fas fa-clock-rotate-left"
          text="History"
          :to="{
            name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
            query: applicationId ? { applicationId } : undefined,
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
