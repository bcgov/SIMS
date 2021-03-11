<template>
  <Card class="p-m-4">
    <template #title>Institution Profile Setup</template>
    <template #content>
      <form>
        <Message severity="info">
          Please notice that the read-only information below is retrieved from
          your BCeID account and it is not possible to change it here. If any
          read-only information needs to be changed please visit
          <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
        </Message>
        <h2>Let’s Complete Your Profile</h2>
        <h4>User Information</h4>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col">
            <label for="firstName">First Name</label>
            <InputText
              id="firstName"
              v-model="readonlyProfileState.userfirstName"
              readonly
            />
          </div>
          <div class="p-field p-col">
            <label for="lastName">Last Name</label>
            <InputText
              id="lastName"
              v-model="readonlyProfileState.userLastName"
              readonly
            />
          </div>
        </div>
        <h4>Institution Information</h4>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col">
            <label for="legalName">Legal Operating Name</label>
            <InputText
              id="legalName"
              v-model="readonlyProfileState.institutionLegalName"
              readonly
            />
          </div>
        </div>
      </form>
    </template>
  </Card>
</template>

<script lang="ts">
import { onMounted, reactive, ref } from "vue";
import { UserService } from "../../services/UserService";

interface ReadonlyProfileState {
  userfirstName: string;
  userLastName: string;
  institutionLegalName: string;
}

export default {
  setup() {
    const readonlyProfileState = ref({} as ReadonlyProfileState);
    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      readonlyProfileState.value = {
        userfirstName: bceidAccount.user.firstname,
        userLastName: bceidAccount.user.surname,
        institutionLegalName: bceidAccount.institution.legalName,
      };
    });

    return {
      readonlyProfileState,
    };
  },
};
</script>

<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
