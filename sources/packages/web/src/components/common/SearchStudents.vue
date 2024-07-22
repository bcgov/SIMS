<template>
  <v-form ref="searchStudentsForm">
    <content-group class="mb-8">
      <v-row>
        <v-col cols="12" lg="11">
          <v-row
            ><v-col cols="12" lg="3">
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
            <v-col cols="12" lg="3">
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
            <v-col cols="12" lg="3">
              <v-text-field
                label="Given names"
                density="compact"
                data-cy="firstName"
                variant="outlined"
                v-model="firstName"
                @keyup.enter="searchStudents"
                hide-details
              /> </v-col
            ><v-col cols="12" lg="3">
              <v-text-field
                label="Last name"
                density="compact"
                data-cy="lastName"
                variant="outlined"
                v-model="lastName"
                @keyup.enter="searchStudents"
                hide-details
              />
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="1">
          <v-btn
            color="primary"
            class="p-button-raised"
            data-cy="searchStudents"
            @click="searchStudents()"
          >
            Search
          </v-btn>
        </v-col>
      </v-row>

      <v-input
        :rules="[isValidSearch()]"
        hide-details="auto"
        error
      /> </content-group
  ></v-form>
  <template v-if="studentsFound">
    <body-header title="Results" />
    <content-group>
      <toggle-content :toggled="!students?.length">
        <DataTable :value="students">
          <Column field="sin" header="SIN" :sortable="true">
            <template #body="slotProps">
              {{ slotProps.data.sin }}
            </template>
          </Column>
          <Column field="firstName" header="Given name" :sortable="true">
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.firstName }}
              </div>
            </template>
          </Column>
          <Column field="lastName" header="Last name" :sortable="true">
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.lastName }}
              </div>
            </template>
          </Column>
          <Column field="birthDate" header="Date of birth">
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
                @click="$emit('goToStudentView', slotProps.data.id)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </template>
</template>
<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import {
  SearchStudentAPIInDTO,
  SearchStudentAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useSnackBar, useValidators } from "@/composables";
import { VForm } from "@/types";

export default defineComponent({
  emits: ["goToStudentView"],
  setup() {
    const searchStudentsForm = ref({} as VForm);
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const { isSINValid } = useValidators();
    const appNumber = ref("");
    const firstName = ref("");
    const lastName = ref("");
    const students = ref([] as SearchStudentAPIOutDTO[]);
    const sin = ref("");
    const isValidSearch = () => {
      const hasNoInput =
        !appNumber.value && !firstName.value && !sin.value && !lastName.value;
      if (hasNoInput) {
        return "Please provide at least one search parameter.";
      }
      if (sin.value) {
        return isSINValid(sin.value) || "Please provide a proper SIN.";
      }
      return true;
    };
    const searchStudents = async () => {
      const validationResult = await searchStudentsForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
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
      dateOnlyLongString,
      isSINValid,
      searchStudentsForm,
      isValidSearch,
    };
  },
});
</script>
