<template>
  <full-page-container>
    <h2 class="color-blue">Search Students</h2>
    <v-row class="mt-5"
      ><v-col><label for="appNumber">Application Number</label></v-col
      ><v-col><label for="firstName">Given Names</label></v-col
      ><v-col><label for="lastName">Last Name</label></v-col> <v-col></v-col
    ></v-row>
    <v-row
      ><v-col
        ><InputText
          type="text"
          data-cy="appNumber"
          v-model="appNumber"
          @keyup.enter="searchStudents()" /></v-col
      ><v-col
        ><InputText
          type="text"
          data-cy="firstName"
          v-model="firstName"
          @keyup.enter="searchStudents()" /></v-col
      ><v-col
        ><InputText
          type="text"
          data-cy="lastName"
          v-model="lastName"
          @keyup.enter="searchStudents()" /></v-col
      ><v-col
        ><v-btn
          :disabled="!appNumber && !firstName && !lastName"
          color="primary"
          class="p-button-raised"
          data-cy="searchStudents"
          @click="searchStudents()"
        >
          <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
          Search
        </v-btn></v-col
      >
    </v-row>

    <DataTable
      v-if="studentsFound"
      class="mt-4"
      :autoLayout="true"
      :value="students"
    >
      <Column field="firstName" header="First Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.firstName }}
          </div>
        </template>
      </Column>
      <Column field="lastName" header="Last Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.lastName }}
          </div>
        </template>
      </Column>
      <Column field="birthDate" header="Date of Birth">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.birthDate }}
          </div>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <v-btn
            variant="outlined"
            data-cy="viewStudent"
            @click="goToViewStudent(slotProps.data.id)"
            >View</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </full-page-container>
</template>
<script lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { SearchStudentResp } from "@/types";
import { useToastMessage } from "@/composables";

export default {
  setup() {
    const toast = useToastMessage();
    const router = useRouter();
    const appNumber = ref("");
    const firstName = ref("");
    const lastName = ref("");
    const students = ref([] as SearchStudentResp[]);
    const goToViewStudent = (studentId: number) => {
      router.push({
        name: AESTRoutesConst.STUDENT_PROFILE,
        params: { studentId: studentId },
      });
    };
    const searchStudents = async () => {
      students.value = await StudentService.shared.searchStudents(
        appNumber.value,
        firstName.value,
        lastName.value,
      );
      if (students.value.length === 0) {
        toast.warn(
          "No Students found",
          "No Students found for the given search criteria.",
        );
      }
    };
    const studentsFound = computed(() => {
      return students.value.length > 0;
    });
    return {
      appNumber,
      firstName,
      lastName,
      studentsFound,
      searchStudents,
      students,
      goToViewStudent,
    };
  },
};
</script>
