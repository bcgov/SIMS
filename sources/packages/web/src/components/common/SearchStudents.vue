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
      <toggle-content :toggled="!students?.length" message="No students found.">
        <v-data-table
          :headers="SearchStudentsHeaders"
          :items="students"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.sin`]="{ item }">
            {{ sinDisplayFormat(item.sin) }}
          </template>
          <template #[`item.firstName`]="{ item }">
            <div class="p-text-capitalize">
              {{ item.firstName }}
            </div>
          </template>
          <template #[`item.lastName`]="{ item }">
            <div class="p-text-capitalize">
              {{ item.lastName }}
            </div>
          </template>
          <template #[`item.birthDate`]="{ item }">
            {{ dateOnlyLongString(item.birthDate) }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              class="p-button-raised"
              data-cy="viewStudent"
              @click="$emit('goToStudentView', item.id)"
              >View</v-btn
            >
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </template>
</template>
<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import { StudentService } from "@/services/StudentService";
import {
  SearchStudentAPIInDTO,
  SearchStudentAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useSnackBar, useValidators } from "@/composables";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  SearchStudentsHeaders,
  VForm,
} from "@/types";

export default defineComponent({
  emits: ["goToStudentView"],
  setup() {
    const searchStudentsForm = ref({} as VForm);
    const snackBar = useSnackBar();
    const { dateOnlyLongString, sinDisplayFormat } = useFormatters();
    const { isSINValid } = useValidators();
    const { mobile: isMobile } = useDisplay();

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
      sinDisplayFormat,
      isSINValid,
      searchStudentsForm,
      isValidSearch,
      SearchStudentsHeaders,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      isMobile,
    };
  },
});
</script>
