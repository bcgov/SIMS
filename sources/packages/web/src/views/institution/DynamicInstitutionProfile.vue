<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your
    BCeID account and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="institutionprofile"
        :data="initialData"
        @changed="changed"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import formio from "../../components/generic/formio.vue";
import { UserService } from "../../services/UserService";
export default {
  components: { formio },
  setup() {
    // Data-bind
    const initialData = ref({});

    // Event handler
    const changed = async () => {
      console.log("changed");
    };
    const submitted = async () => {
      console.log("changed");
    };

    // Hooks
    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      initialData.value = {
        userfFrstName: bceidAccount?.user.firstname,
        userLastName: bceidAccount?.user.surname,
        userEmail: bceidAccount?.user.email,
        institutionLegalName: bceidAccount?.institution.legalName,
      };
    });

    return {
      initialData,
      changed,
      submitted,
    };
  },
};
</script>

<style>
</style>