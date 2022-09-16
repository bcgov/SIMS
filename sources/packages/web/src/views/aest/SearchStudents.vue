<template>
  <full-page-container>
    <body-header
      title="Search Students"
      subTitle="Lookup students by entering their information below."
    >
    </body-header>
    <content-group class="mb-8">
      <v-row
        ><v-col>
          <v-text-field
            label="Application number"
            density="compact"
            data-cy="appNumber"
            variant="outlined"
            v-model="appNumber"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col>
          <v-text-field
            label="SIN"
            density="compact"
            data-cy="sin"
            variant="outlined"
            v-model="sin"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col>
          <v-text-field
            label="Given names"
            density="compact"
            data-cy="firstName"
            variant="outlined"
            v-model="firstName"
            @keyup.enter="searchStudents"
            hide-details
          /> </v-col
        ><v-col>
          <v-text-field
            label="Last name"
            density="compact"
            data-cy="lastName"
            variant="outlined"
            v-model="lastName"
            @keyup.enter="searchStudents"
            hide-details
          /> </v-col
        ><v-col
          ><v-btn
            :disabled="
              !appNumber && !firstName && !lastName && !isSINValid(sin)
            "
            color="primary"
            class="p-button-raised"
            data-cy="searchStudents"
            @click="searchStudents()"
          >
            Search
          </v-btn></v-col
        >
      </v-row>
    </content-group>
    <body-header title="Results" v-if="studentsFound" />
    <content-group v-if="studentsFound">
      <toggle-content :toggled="!students?.length">
        <DataTable :value="students">
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
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                color="primary"
                class="p-button-raised"
                data-cy="viewStudent"
                @click="goToViewStudent(slotProps.data.id)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>
<script lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  SearchStudentAPIInDTO,
  SearchStudentAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useSnackBar, useValidators } from "@/composables";

export default {
  setup() {
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const { isSINValid } = useValidators();
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
      const payload: SearchStudentAPIInDTO = {
        appNumber: appNumber.value,
        firstName: firstName.value,
        lastName: lastName.value,
        sin: sin.value,
      };
      students.value = await StudentService.shared.searchStudents(payload);
      if (students.value.length === 0) {
        snackBar.warn("No Students found for the given search criteria. ");
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
