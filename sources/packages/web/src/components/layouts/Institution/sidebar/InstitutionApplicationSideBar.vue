<template>
  <v-navigation-drawer app color="default" permanent>
    <v-list
      active-class="active-list-item"
      density="compact"
      bg-color="default"
      active-color="primary"
      class="no-wrap"
      :items="items"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel } from "@/types";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const items = ref<MenuItemModel[]>([
      {
        title: "Student",
        props: {
          prependIcon: "mdi-school-outline",
          to: {
            name: InstitutionRoutesConst.STUDENT_APPLICATION_DETAILS,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          },
        },
      },
      {
        title: "Assessments",
        props: {
          prependIcon: "mdi-checkbox-marked-outline",
          to: {
            name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          },
        },
      },
    ]);
    return {
      items,
    };
  },
});
</script>
