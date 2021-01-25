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
          <label for="firstName">First Name</label>
          <InputText id="firstName" v-model="studentProfile.displayName" readonly />
      </div>
      <div class="p-field p-col">
          <label for="familyName">Family Name</label>
          <InputText id="familyName" v-model="studentProfile.familyName" readonly />
      </div>
    </div>
    <div class="p-fluid p-formgrid p-grid">
      <div class="p-field p-col">
          <label for="middleName">Middle Name</label>
          <InputText id="middleName" v-model="studentProfile.middleName" readonly />
      </div>
      <div class="p-field p-col">
          <label for="dateOfBirth">Date of Birth</label>
          <InputText id="dateOfBirth" v-model="studentProfile.dateOfBirth" readonly />
      </div>
    </div> 
    <div class="p-fluid p-formgrid p-grid">
      <div class="p-field p-col">
          <label for="verifiedEmail">Verified Email</label>
          <InputText id="verifiedEmail" v-model="studentProfile.emailVerified" readonly />
      </div>
      <div class="p-field p-col">
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
  setup() {
    const store = useStore();
    const studentProfile = computed(() => store.state.student.profile);
    // console.log(`Printing studentProfile  ${studentProfile.value}`);    
    return { studentProfile };
  }
};
</script>
