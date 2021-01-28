<template>
  <Card class="p-m-4">
    <template #title>
      Student Information
    </template>
    <template #content>
      <form @submit.prevent="onSubmit" novalidate>
        <!--The information from Services Card includes First Name, Last Name, Middle Name, Date of Birth, 
        verified email, and Gender as read-only-->
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col">
            <label for="firstName">Given Names</label>
            <InputText
              id="firstName"
              v-model="readonlyProfile.givenNames"
              readonly
            />
          </div>
          <div class="p-field p-col">
            <label for="lastName">Last Name</label>
            <InputText
              id="lastName"
              v-model="readonlyProfile.lastName"
              readonly
            />
          </div>
        </div>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col">
            <label for="dateOfBirth">Date of Birth</label>
            <InputText
              id="dateOfBirth"
              v-model="readonlyProfile.birthdate"
              readonly
            />
          </div>
          <div class="p-field p-col">
            <label for="verifiedEmail">Verified Email</label>
            <InputText
              id="verifiedEmail"
              v-model="readonlyProfile.email"
              readonly
            />
          </div>
        </div>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-6">
            <label for="gender">Gender</label>
            <InputText id="gender" v-model="readonlyProfile.gender" readonly />
          </div>
          <div class="p-field p-col-6">
            <label for="sinNumber">Social Insurance number</label>
            <ValidatedInput :property="model.sinNumber">
              <InputText id="sinNumber" v-model="model.sinNumber.$model" />
            </ValidatedInput>
          </div>
        </div>
        <h3 class="p-mb-5">Contact Information</h3>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-grid p-col-12">
            <div class="p-field p-col-6">
              <label for="phone">Phone Number</label>
              <ValidatedInput :property="model.phone">
                <InputText id="phone" v-model="model.phone.$model" />
              </ValidatedInput>
            </div>
          </div>
          <div class="p-field p-col-6">
            <label for="addressLine1">Address Line 1</label>
            <ValidatedInput :property="model.addressLine1">
              <InputText
                id="addressLine1"
                v-model="model.addressLine1.$model"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="addressLine2">Address Line 2</label>
            <InputText id="addressLine2" v-model="model.addressLine2.$model" />
          </div>
          <div class="p-field p-col-6">
            <label for="city">City</label>
            <ValidatedInput :property="model.city">
              <InputText id="city" v-model="model.city.$model" />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="provinceState">Province/State</label>
            <ValidatedInput :property="model.provinceState">
              <InputText
                id="provinceState"
                v-model="model.provinceState.$model"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="country">Country</label>
            <ValidatedInput :property="model.country">
              <InputText id="country" v-model="model.country.$model" />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="postalCode">Postal/Zip Code</label>
            <ValidatedInput :property="model.postalCode">
              <InputText id="postalCode" v-model="model.postalCode.$model" />
            </ValidatedInput>
          </div>
        </div>
        <Button type="submit" label="Save Profile" icon="pi pi-save"></Button>
      </form>
    </template>
  </Card>
</template>

<script lang="ts">
import { computed, reactive } from "vue";
import { useStore } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import ValidatedInput from "../components/ValidatedInput.vue";

interface ProfileState {
  phone: string;
  sinNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export default {
  components: {
    ValidatedInput
  },
  setup() {
    // Readonly student data from state.
    const store = useStore();
    const readonlyProfile = computed(() => store.state.student.profile);
    // State data that could be edited by the user.
    const profileState = reactive({} as ProfileState);
    const validationRules = {
      phone: { required },
      sinNumber: { required },
      addressLine1: { required },
      addressLine2: {},
      city: { required },
      provinceState: { required },
      country: { required },
      postalCode: { required }
    };

    const model = useVuelidate(validationRules, profileState);

    const onSubmit = () => {
      model.value.$touch();
      if (model.value.$invalid) {
        return;
      }
      // TODO: Replace below alert with the API/Service call.
      alert(JSON.stringify(profileState, null, 2));
    };

    return { readonlyProfile, model, onSubmit };
  }
};
</script>

<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
