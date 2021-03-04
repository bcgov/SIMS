<template>
  <div class="confirm-info-panel">
    <h2 class="header-text">Confirm StudentAid BC Profile Information</h2>
    <h4 class="header-text">YOUR STUDENTAID BC PROFILE INFORMATION</h4>
    This information was provided by you when you first signed in to your
    account as well as shared by your BC Services Card login.
    <div></div>
    <div class="p-fluid  p-grid p-extra">
      <div class="p-field p-col-4">
        <label for="fullName" class="label-extra">Full Name</label>
        <div class="p-col text-extra">
          {{ studentInfo.firstName }} {{ studentInfo.lastName }}
        </div>
      </div>
    </div>
    <div class="p-fluid  p-grid ">
      <div class="p-field p-col-4">
        <label for="dateOfBirth" class="label-extra">Date of Birth</label>
        <div class="p-col text-extra">
          {{ studentInfo.birthDateFormatted }}
        </div>
      </div>
      <div class="p-field p-col-4">
        <label for="gender" class="label-extra">Gender</label>
        <div class=" p-col text-extra">{{ studentInfo.gender }}</div>
      </div>
    </div>
    <h4 class="p-mb-5">
      If the Information is incorrect, please
      <router-link :to="{ name: 'Student-Profile-Edit' }"
        >click here</router-link
      >
    </h4>
    <div class="p-fluid p-formgrid p-grid">
      <div class="p-field p-col-4">
        <label for="homeAddress" class="label-extra">Home Address</label>
        <div class="p-field p-col text-extra">
          {{ studentContact.addressLine1 }}<br />
          <div v-show="studentContact.addressLine2">
            {{ studentContact.addressLine2 }}<br />
          </div>
          {{ studentContact.city }}
          {{ studentContact.provinceState }}
          {{ studentContact.postalCode }}<br />
          {{ studentContact.country }}<br />
        </div>
      </div>
      <div class="p-field p-col-6">
        <label for="phone" class="label-extra">Phone Number</label>
        <div class="p-field p-col text-extra">
          {{ studentContact.phone }}
        </div>
      </div>
    </div>

    <div class="p-field-checkbox p-checkbox-icon">
      <Checkbox
        id="infoConfirmation"
        v-model="confirmState.checked"
        :binary="true"
      />
      <label for="infoConfirmation"
        >I confirm my StudentAid BC Profile information shown is correct</label
      >
    </div>
  </div>
</template>
<script>
import { onMounted, ref, reactive } from "vue";
import { StudentService } from "../../../../services/StudentService";

export default {
  setup() {
    //Creating a reactive array
    const studentInfo = ref([]);
    const studentContact = ref([]);
    const confirmState = reactive({ checked: false });

    onMounted(async () => {
      //Get the student info from api call
      const studentInfoFrmService = await StudentService.shared.getStudentInfo();
      studentInfo.value = studentInfoFrmService;
      studentContact.value = studentInfoFrmService.contact;
    });
    return { studentInfo, studentContact, confirmState };
  },
};
</script>
<style>
.confirm-info-panel {
  padding: 20px;
  display: flex;
  width: 70%;
  flex-direction: column;
  border-radius: 10px;
  border: 2px solid #dfe3e8;
  font-family: Arial, Helvetica, sans-serif;
  margin: 10px 10px 20px 20px;
}

.p-extra {
  margin-top: 10px;
}

.label-extra {
  font-weight: bold;
  color: rgb(97, 95, 95);
}

.text-extra {
  color: rgb(65, 53, 53);
}

.header-text {
  color: darkblue;
  font-weight: bold;
}
</style>
