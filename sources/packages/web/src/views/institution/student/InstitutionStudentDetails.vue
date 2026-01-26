<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        title="Student Details"
        :sub-title="studentDetails.fullName"
      />
    </template>
    <template #tab-header>
      <v-tabs stacked grow show-arrows="always">
        <v-tab
          v-for="item in items"
          :text="item.label"
          :key="item.label"
          :to="item.command()"
          :prepend-icon="item.icon"
          :ripple="false"
          class="font-weight-bold"
        />
      </v-tabs>
    </template>
    <router-view />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentProfile } from "@/types";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const studentDetails = ref({} as StudentProfile);
    const items = ref([
      {
        label: "Profile",
        icon: "fa:far fa-address-book",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_PROFILE,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Applications",
        icon: "fa:far fa-folder-open",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Restrictions",
        icon: "fa:far fa-times-circle",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_RESTRICTIONS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "File Uploads",
        icon: "fa:far fa-file-alt",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_FILE_UPLOADS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Balances",
        icon: "fa:fa fa-circle-dollar-to-slot",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_BALANCES,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Notes",
        icon: "fa:fa fa-sticky-note",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_NOTES,
          params: { studentId: props.studentId },
        }),
      },
    ]);

    onMounted(async () => {
      studentDetails.value = await StudentService.shared.getStudentProfile(
        props.studentId,
      );
    });

    return {
      items,
      studentDetails,
    };
  },
});
</script>
