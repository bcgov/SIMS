<template>
  <label for="appNumber">Application Number</label>
  <ValidatedInput property-name="appNumber">
    <Field name="appNumber" label="Application Number" as="InputText" />
  </ValidatedInput>
  <label for="firstName">Given Name</label>
  <ValidatedInput property-name="firstName">
    <Field name="firstName" label="Given Name" as="InputText" />
  </ValidatedInput>
  <label for="lastName">Last Name</label>
  <ValidatedInput property-name="lastName">
    <Field name="lastName" label="Last Name" as="InputText" />
  </ValidatedInput>
  <v-container>
    <v-btn
      color="primary"
      class="p-button-raised"
      @click="goToSearchStudents(appNumber, firstName, lastName)"
    >
      <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
      Search Students
    </v-btn>

    <DataTable :autoLayout="true" :value="students">
      <Column field="appNumber" header="Application Number" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.appNumber }}
          </div>
        </template>
      </Column>
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
      <Column field="birthDate" header="Date of Birth" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.birthDate }}
          </div>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <v-btn outlined @click="goToViewStudent(slotProps.data.id)"
            >View</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </v-container>
</template>
<script lang="ts">
import { StudentService } from "../../services/StudentService";
import ValidatedInput from "../../components/generic/ValidatedInput.vue";
export default {
  components: {
    ValidatedInput,
  },
  setup(props: any) {
    const goToSearchStudents = (
      appNumber: string,
      firstName: string,
      lastName: string,
    ) => {
      return StudentService.shared.searchStudents(
        appNumber,
        firstName,
        lastName,
      );
    };
    return {
      goToSearchStudents,
    };
  },
};
</script>
