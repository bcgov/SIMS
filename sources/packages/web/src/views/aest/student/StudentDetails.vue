<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Student Details"
        :subTitle="studentDetails.firstName"
      >
        <template #sub-title-details>
          <designation-and-restriction-status-badge
            class="mb-4 ml-4 mt-4"
            :status="
              studentDetails.hasRestriction
                ? DesignationAndRestrictionStatus.restriction
                : DesignationAndRestrictionStatus.noRestriction
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
import DesignationAndRestrictionStatusBadge from "@/components/generic/DesignationAndRestrictionStatusBadge.vue";
import { StudentDetail, DesignationAndRestrictionStatus } from "@/types";

export default {
  components: { DesignationAndRestrictionStatusBadge },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const studentDetails = ref({} as StudentDetail);
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
      studentDetails.value = await StudentService.shared.getStudentDetail(
        props.studentId,
      );
    });

    return {
      goBack,
      AESTRoutesConst,
      items,
      studentDetails,
      DesignationAndRestrictionStatus,
    };
  },
};
</script>
