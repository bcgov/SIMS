<template>
  <full-page-container>
    <h2 class="color-blue">Search Students</h2>
    <v-row class="mt-5"
      ><v-col>Application Number</v-col><v-col>SIN</v-col
      ><v-col>Given Names</v-col><v-col>Last Name</v-col> <v-col></v-col
    ></v-row>
    <v-row
      ><v-col>
        <v-text-field
          density="compact"
          data-cy="appNumber"
          variant="outlined"
          v-model="appNumber"
          @keyup.enter="searchStudents"
        />
      </v-col>
      <v-col>
        <v-text-field
          density="compact"
          data-cy="sin"
          variant="outlined"
          v-model="sin"
          @keyup.enter="searchStudents"
        />
      </v-col>
      <v-col>
        <v-text-field
          density="compact"
          data-cy="firstName"
          variant="outlined"
          v-model="firstName"
          @keyup.enter="searchStudents"
        /> </v-col
      ><v-col>
        <v-text-field
          density="compact"
          data-cy="lastName"
          variant="outlined"
          v-model="lastName"
          @keyup.enter="searchStudents"
        /> </v-col
      ><v-col
        ><v-btn
          :disabled="!appNumber && !firstName && !lastName && !isSINValid(sin)"
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
            {{ dateOnlyLongString(slotProps.data.birthDate) }}
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
import { SearchStudentAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useToastMessage } from "@/composables";

export default {
  setup() {
    const toast = useToastMessage();
    const { dateOnlyLongString, isSINValid } = useFormatters();
    const router = useRouter();
    const appNumber = ref("");
    const firstName = ref("");
    const lastName = ref("");
    const students = ref([] as SearchStudentAPIOutDTO[]);
    const sin = ref("");
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
        sin.value,
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
      sin,
      appNumber,
      firstName,
      lastName,
      studentsFound,
      searchStudents,
      students,
      goToViewStudent,
      dateOnlyLongString,
      isSINValid,
    };
  },
};
</script>
