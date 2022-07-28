<template>
  <full-page-container layout-template="start" :fluid="true">
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
                ? StudentRestrictionStatus.restriction
                : StudentRestrictionStatus.noRestriction
            "
          />
        </template>
      </header-navigator>
    </template>
    <!-- TODO:replace prime tabMenu with vuetify3-->
    <TabMenu :model="items" />
    <router-view />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StudentRestrictionChip from "@/components/generic/StudentRestrictionChip.vue";
import { StudentRestrictionStatus } from "@/types";
import { AESTStudentProfileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default {
  components: { StudentRestrictionChip },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const studentDetails = ref({} as AESTStudentProfileAPIOutDTO);
    // TODO: replace all fa icons with fas as per figma with replace with vuetify3
    const items = ref([
      {
        label: "Profile",
        icon: "fa fa-id-card-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_PROFILE,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Applications",
        icon: "fa fa-folder-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_APPLICATIONS,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Restrictions",
        icon: "fa fa-times-circle-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_RESTRICTION,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "File Uploads",
        icon: "fa fa-file-text-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_FILE_UPLOADS,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Social insurance number",
        icon: "fa fa-check-square-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.SIN_MANAGEMENT,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Notes",
        icon: "fa fa-sticky-note-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_NOTES,
            params: { studentId: props.studentId },
          });
        },
      },
    ]);

    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_STUDENTS,
      });
    };

    onMounted(async () => {
      studentDetails.value = (await StudentService.shared.getStudentProfile(
        props.studentId,
      )) as AESTStudentProfileAPIOutDTO;
    });

    return {
      goBack,
      AESTRoutesConst,
      items,
      studentDetails,
      StudentRestrictionStatus,
    };
  },
};
</script>
