<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        title="Student Details"
        :sub-title="studentDetails.fullName"
      >
        <template #sub-title-details>
          <student-restriction-chip
            class="mx-4"
            :has-active-restriction="studentDetails.hasRestriction"
          />
        </template>
      </header-navigator>
    </template>
    <template #tab-header>
      <v-tabs color="primary" stacked grow show-arrows="always">
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
import {
  ref,
  defineComponent,
  computed,
  watchEffect,
  onMounted,
  onUnmounted,
} from "vue";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StudentRestrictionChip from "@/components/generic/StudentRestrictionChip.vue";
import { AESTStudentProfileAPIOutDTO } from "@/services/http/dto";
import { DisabilityStatus, Role } from "@/types";
import useEmitterEvents from "@/composables/useEmitterEvents";
import { useAuth } from "@/composables";

export default defineComponent({
  components: { StudentRestrictionChip },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { hasRole } = useAuth();
    const { refreshStudentSearchProfileOn, refreshStudentSearchProfileOff } =
      useEmitterEvents();
    const studentDetails = ref({} as AESTStudentProfileAPIOutDTO);
    const items = computed(() => [
      {
        label: "Profile",
        icon: "fa:far fa-address-book",
        command: () => ({
          name: AESTRoutesConst.STUDENT_PROFILE,
          params: { studentId: props.studentId },
        }),
      },
      ...(hasRole(Role.StudentEditDisabilityProfile) &&
      studentDetails.value.disabilityStatus !== DisabilityStatus.NotRequested
        ? [
            {
              label: "Disability",
              icon: "fa:fa fa-universal-access",
              command: () => ({
                name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
                params: { studentId: props.studentId },
              }),
            },
          ]
        : []),
      {
        label: "Applications",
        icon: "fa:far fa-folder-open",
        command: () => ({
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId: props.studentId },
        }),
      },
      {
        label: "Forms",
        icon: "fa:fas fa-inbox",
        command: () => ({
          name: AESTRoutesConst.STUDENT_FORM_SUBMISSION_HISTORY,
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
        label: "MSFAA",
        icon: "fa:fa fa-file-signature",
        command: () => ({
          name: AESTRoutesConst.STUDENT_MSFAA,
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

    const loadStudentDetails = async () => {
      studentDetails.value = (await StudentService.shared.getStudentProfile(
        props.studentId,
      )) as AESTStudentProfileAPIOutDTO;
    };

    watchEffect(async () => {
      await loadStudentDetails();
    });

    onMounted(() => {
      refreshStudentSearchProfileOn(loadStudentDetails);
    });

    onUnmounted(() => {
      refreshStudentSearchProfileOff(loadStudentDetails);
    });

    return {
      items,
      studentDetails,
    };
  },
});
</script>
