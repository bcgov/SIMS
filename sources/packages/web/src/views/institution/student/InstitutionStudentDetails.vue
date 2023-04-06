<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        title="Student Details"
        :subTitle="studentDetails.fullName"
      >
      </header-navigator>
    </template>
    <template #tab-header>
      <v-tabs :model="tab" stacked color="primary"
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
import { useRouter } from "vue-router";
import { StudentService } from "@/services/StudentService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentRestrictionStatus, StudentProfile } from "@/types";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const tab = ref();
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
        label: "Notes",
        icon: "fa:fa fa-sticky-note",
        command: () => ({
          name: InstitutionRoutesConst.STUDENT_NOTES,
          params: { studentId: props.studentId },
        }),
      },
    ]);

    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.INSTITUTION_STUDENT_SEARCH,
      });
    };

    onMounted(async () => {
      studentDetails.value = await StudentService.shared.getStudentProfile(
        props.studentId,
      );
    });

    return {
      goBack,
      items,
      studentDetails,
      StudentRestrictionStatus,
      tab,
    };
  },
});
</script>
