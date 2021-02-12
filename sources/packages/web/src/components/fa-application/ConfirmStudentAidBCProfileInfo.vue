<template>
  <div class="confirm-info-panel">
    <h2>Confirm StudentAid BC Profile Information</h2>
    <h4>Your StudentAid BC Profile Information</h4>
    This information was provided by you when you first signed in to your
    account as well as shared by your BC Services Card login.

    <div class="p-fluid">
      <div class="p-field p-col">
        <label for="fullName">Full Name</label>
        <div class="p-field p-col">{{ studentConfirmInfo.fullName }}</div>
      </div>
    </div>
    <div class="p-fluid p-formgrid p-grid">
      <div class="p-field p-col-4">
        <label for="dateOfBirth">Date of Birth</label>
        <div class="p-field p-col">{{ studentConfirmInfo.dateOfBirth }}</div>
      </div>
      <div class="p-field p-col-4">
        <label for="gender">Gender</label>
        <div class="p-field p-col">{{ studentConfirmInfo.gender }}</div>
      </div>
    </div>
    <h4 class="p-mb-5">If the Information is incorrect, please click here</h4>
    <div class="p-fluid p-formgrid p-grid">
      <div class="p-field p-col-4">
        <label for="homeAddress">Home Address</label>
        <!-- <div class="p-field p-col">
          #112 1042 Jervis Street,
          <br />
          Victoria BC V3C0J5
          <br />
          Canada
        </div> -->
        <div class="p-field p-col">{{ studentConfirmInfo.addressLine1 }}<br/>{{ studentConfirmInfo.addressLine2 }},<br/>{{ studentConfirmInfo.city }} {{ studentConfirmInfo.provinceState }} {{ studentConfirmInfo.postalCode }}<br/>{{ studentConfirmInfo.country }}<br/></div>
      </div>
      <div class="p-grid p-col-6">
        <div class="p-field p-col-6">
          <label for="phone">Phone Number</label>
          <div class="p-field p-col">{{ studentConfirmInfo.phoneNumber }}</div>
        </div>
      </div>
    </div>

    <div class="p-field-checkbox p-checkbox-icon">
      <Checkbox id="infoConfirmation" />
      <label for="infoConfirmation"
        >I confirm my StudentAid BC Profile information shown is correct</label
      >
    </div>
  </div>
</template> 
<script>
import { onMounted,ref } from "vue";
import { StudentService } from "../../services/StudentService";
import { student } from '@/store/modules/student/student';

export default {   
  setup() {
    
    //Creating a reactive array
    const studentConfirmInfo = ref([]);      
    onMounted(async () => {
        //Get the student info from api call
        const studentConfirmInfoFrmService = await StudentService.shared.getStudentConfirmInfo(); 
        studentConfirmInfo.value = studentConfirmInfoFrmService;
     });  
     
     return { studentConfirmInfo }
  },
};
</script>  
<style>
.confirm-info-panel {
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 2px solid #dfe3e8;
  font-family: Arial, Helvetica, sans-serif;
}
</style>