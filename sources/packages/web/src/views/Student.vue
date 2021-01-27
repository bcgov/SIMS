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
        <div class="p-field p-col-6">
          <label for="sinNumber">Social Insurance number</label>
          <InputText id="sinNumber" v-model="contactInfo.sinNumber" />
        </div>
      </div>
      <h3 class="p-mb-5">Contact Information</h3>
      <div class="p-fluid p-formgrid p-grid">
        <div class="p-grid p-col-12">
          <div class="p-field p-col-6">
            <label for="phone">Phone Number</label>
            <InputText id="phone" v-model="contactInfo.phone" />
          </div>
        </div>
        <div class="p-field p-col-6">
          <label for="addressLine1">Address Line 1</label>
          <InputText id="addressLine1" v-model="contactInfo.addressLine1" />
        </div>
        <div class="p-field p-col-6">
          <label for="addressLine2">Address Line 2</label>
          <InputText id="addressLine2" v-model="contactInfo.addressLine2" />
        </div>
        <div class="p-field p-col-6">
          <label for="city">City</label>
          <InputText id="city" v-model="contactInfo.city" />
        </div>
        <div class="p-field p-col-6">
          <label for="provinceState">Province/State</label>
          <InputText id="provinceState" v-model="contactInfo.provinceState" />
        </div>
        <div class="p-field p-col-6">
          <label for="country">Country</label>
          <InputText id="country" v-model="contactInfo.country" />
        </div>
        <div class="p-field p-col-6">
          <label for="postalCode">Postal Code</label>
          <InputText id="postalCode" v-model="contactInfo.postalCode" />
        </div>
      </div>
      
    </template>
    <template #footer>
      <Button
        label="Save Profile"
        icon="pi pi-save"
        @click="save"
      ></Button>
    </template>
  </Card>
</template>

<script lang="ts">
import { computed, reactive } from "vue";
import { useStore } from "vuex";

class ProfileState{
  phone = "";
  sinNumber = "";
  addressLine1 = "";
  addressLine2 = "";
  city = "";
  provinceState = "";
  country = "";
  postalCode = "";
}

export default {
  setup() {
    const store = useStore();
    const studentProfile = computed(() => store.state.student.profile);
    const contactInfo = reactive(new ProfileState());

    const save = () => {
      // To be removed once the API call is ready.
      alert(JSON.stringify(contactInfo));
    }

    return { studentProfile, contactInfo, save };
  }
};
</script>
<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
