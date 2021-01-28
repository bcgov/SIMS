<template>
  <Card class="p-m-4">
    <template #title>
      Student Information
    </template>
    <template #content>
      <!--The information from Services Card includes First Name, Last Name, Middle Name, Date of Birth, 
     verified email, and Gender as read-only-->     
     <div class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col">
          <label for="firstName">Given Names</label>
          <InputText
            id="firstName"
            v-model="studentProfile.givenNames"
            readonly
          />
     </div>
     <div class="p-field p-col">
          <label for="lastName">Last Name</label>
          <InputText id="lastName" v-model="studentProfile.lastName" readonly />
        </div>
     </div>
     <div class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col">
          <label for="dateOfBirth">Date of Birth</label>
          <InputText
            id="dateOfBirth"
            v-model="studentProfile.birthdate"
            readonly
          />
     </div>
     <div class="p-field p-col">
          <label for="verifiedEmail">Verified Email</label>
          <InputText
            id="verifiedEmail"
            v-model="studentProfile.email"
            readonly
          />
     </div>
     </div>
      <div class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col-6">
          <label for="gender">Gender</label>
          <InputText id="gender" v-model="studentProfile.gender" readonly />
      </div>
     </div>
      
    </template>
  </Card>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
export default {
  name: "Student",    
  setup() {
    const store = useStore();
    const studentProfile = computed(() => store.state.student.profile);    
    return { studentProfile};
  }
};
</script>
