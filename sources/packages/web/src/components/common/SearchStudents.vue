<template>
  <v-form ref="searchStudentsForm">
    <content-group class="mb-2">
      <v-row density="compact">
        <v-col cols="12" lg>
          <v-text-field
            label="Certificate number"
            density="compact"
            variant="outlined"
            v-model.trim="documentNumber"
            :rules="[
              (v: string) =>
                checkRegexPattern(
                  v,
                  DOCUMENT_NUMBER_REGEX,
                  'Certificate number',
                  false,
                ),
            ]"
            :maxlength="DOCUMENT_NUMBER_MAX_LENGTH"
            @keyup.enter="searchStudents"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" lg>
          <v-text-field
            label="Email address"
            density="compact"
            variant="outlined"
            v-model.trim="email"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col cols="12" lg>
          <v-text-field
            label="Application number"
            density="compact"
            variant="outlined"
            v-model.trim="appNumber"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col cols="12" lg>
          <v-text-field
            label="SIN"
            density="compact"
            variant="outlined"
            v-model.trim="sin"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col cols="12" lg>
          <v-text-field
            label="Given names"
            density="compact"
            variant="outlined"
            v-model.trim="firstName"
            @keyup.enter="searchStudents"
            hide-details
          /> </v-col
        ><v-col cols="12" lg>
          <v-text-field
            label="Last name"
            density="compact"
            variant="outlined"
            v-model.trim="lastName"
            @keyup.enter="searchStudents"
            hide-details
          />
        </v-col>
        <v-col cols="auto">
          <v-btn color="primary" @click="searchStudents()"> Search </v-btn>
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
          <template #[`item.sin`]="{ item }">
            <div class="text-no-wrap">
              {{ sinDisplayFormat(item.sin) }}
            </div>
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
            <div class="p-text-capitalize text-no-wrap">
              {{ dateOnlyLongString(item.birthDate) }}
            </div>
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn color="primary" @click="$emit('goToStudentView', item.id)"
              >View</v-btn
            >
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </template>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useDisplay } from "vuetify";
import { StudentService } from "@/services/StudentService";
import {
  SearchStudentAPIInDTO,
  SearchStudentAPIOutDTO,
} from "@/services/http/dto";
import {
  useFormatters,
  useRules,
  useSnackBar,
  useValidators,
} from "@/composables";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  SearchStudentsHeaders,
} from "@/types";
import type { VForm } from "@/types";
import { defineEmits } from "vue";

defineEmits<{
  goToStudentView: [studentId: number];
}>();

// Max length accepted by the API for the certificate (document) number.
const DOCUMENT_NUMBER_MAX_LENGTH = 9;
const DOCUMENT_NUMBER_REGEX = new RegExp(
  `^\\d{1,${DOCUMENT_NUMBER_MAX_LENGTH}}$`,
);

const searchStudentsForm = ref({} as VForm);
const snackBar = useSnackBar();
const { dateOnlyLongString, sinDisplayFormat } = useFormatters();
const { isSINValid } = useValidators();
const { checkRegexPattern } = useRules();
const { mobile: isMobile } = useDisplay();

const appNumber = ref("");
const firstName = ref("");
const lastName = ref("");
const students = ref([] as SearchStudentAPIOutDTO[]);
const sin = ref("");
const email = ref("");
const documentNumber = ref("");

const isValidSearch = () => {
  const hasNoInput =
    !appNumber.value &&
    !firstName.value &&
    !sin.value &&
    !lastName.value &&
    !email.value &&
    !documentNumber.value;
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
    email: email.value,
    documentNumber: documentNumber.value
      ? Number(documentNumber.value)
      : undefined,
  };
  students.value = await StudentService.shared.searchStudents(payload);
  if (students.value.length === 0) {
    snackBar.warn("No Students found for the given search criteria. ");
  }
};

const studentsFound = computed(() => students.value.length > 0);
</script>
