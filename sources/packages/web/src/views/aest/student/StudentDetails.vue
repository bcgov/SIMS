<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        title="Student Details"
        :subTitle="studentDetails.fullName"
      >
        <template #sub-title-details>
          <student-restriction-chip
            class="ml-4 mt-1"
            :status="
              studentDetails.hasRestriction
                ? StudentRestrictionStatus.Restriction
                : StudentRestrictionStatus.NoRestriction
            "
          />
        </template>
      </header-navigator>
    </template>
    <template #tab-header>
      <v-tabs stacked color="primary"
        ><v-tab
          v-for="item in items"
          :key="item.label"
          :to="item.command()"
          :ripple="false"
          ><div>
            <v-icon start :icon="item.icon" class="px-1"></v-icon>
            <span class="mx-2 label-bold"> {{ item.label }} </span>
          </div>
        </v-tab>
      </v-tabs>
    </template>
    <router-view />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StudentRestrictionChip from "@/components/generic/StudentRestrictionChip.vue";
import { StudentRestrictionStatus } from "@/types";
import { AESTStudentProfileAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  components: { StudentRestrictionChip },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const studentDetails = ref({} as AESTStudentProfileAPIOutDTO);
    const items = ref([
      {
        label: "Profile",
        icon: "fa:far fa-address-book",
        command: () => ({
          name: AESTRoutesConst.STUDENT_PROFILE,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Applications",
        icon: "fa:far fa-folder-open",
        command: () => ({
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Restrictions",
        icon: "fa:far fa-times-circle",
        command: () => ({
          name: AESTRoutesConst.STUDENT_RESTRICTION,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "File Uploads",
        icon: "fa:far fa-file-alt",
        command: () => ({
          name: AESTRoutesConst.STUDENT_FILE_UPLOADS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Social insurance number",
        icon: "fa:far fa-check-square",
        command: () => ({
          name: AESTRoutesConst.SIN_MANAGEMENT,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "CAS Supplier Information",
        icon: "fa:fa fa-calculator",
        command: () => ({
          name: AESTRoutesConst.CAS_SUPPLIER_MANAGEMENT,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Balances",
        icon: "fa:fa fa-circle-dollar-to-slot",
        command: () => ({
          name: AESTRoutesConst.STUDENT_BALANCES,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Notes",
        icon: "fa:fa fa-sticky-note",
        command: () => ({
          name: AESTRoutesConst.STUDENT_NOTES,
          params: { studentId: props.studentId },
        }),
      },
    ]);

    onMounted(async () => {
      studentDetails.value = (await StudentService.shared.getStudentProfile(
        props.studentId,
      )) as AESTStudentProfileAPIOutDTO;
    });

    return {
      items,
      studentDetails,
      StudentRestrictionStatus,
    };
  },
});
</script>
