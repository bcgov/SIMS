<template>
  <Card class="p-m-4">
    <template #title> Student Information </template>
    <template #content>
      <form @submit="onSubmit" novalidate>
        <!--The information from Services Card includes First Name, Last Name, Middle Name, Date of Birth, 
        verified email, and Gender as read-only-->
        <Message severity="info">
          Please notice that the read-only information below is retrieved from
          your BC Service Card and it is not possible to change it here. If any
          read-only information needs to be changed please visit
          <a href="http://id.gov.bc.ca" target="_blank">id.gov.bc.ca</a>.
        </Message>
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
          <div class="p-field p-col-6" v-if="!edit">
            <label for="sinNumber">Social Insurance number</label>
            <ValidatedInput property-name="sinNumber">
              <Field
                name="sinNumber"
                label="Social Insurance number"
                rules="required|sin-number"
                type="number"
                maxlength="9"
                as="InputText"
              />
            </ValidatedInput>
          </div>
        </div>
        <h3 class="p-mb-5">Contact Information</h3>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-grid p-col-12">
            <div class="p-field p-col-6">
              <label for="phone">Phone Number</label>
              <ValidatedInput property-name="phone">
                <Field
                  name="phone"
                  label="Phone Number"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
          </div>
          <div class="p-field p-col-6">
            <label for="addressLine1">Address Line 1</label>
            <ValidatedInput property-name="addressLine1">
              <Field
                name="addressLine1"
                label="Address Line 1"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="addressLine2">Address Line 2</label>
            <Field name="addressLine2" as="InputText" />
          </div>
          <div class="p-field p-col-6">
            <label for="city">City</label>
            <ValidatedInput property-name="city">
              <Field name="city" label="City" rules="required" as="InputText" />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="provinceState">Province/State</label>
            <ValidatedInput property-name="provinceState">
              <Field
                name="provinceState"
                label="Province/State"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="country">Country</label>
            <ValidatedInput property-name="country">
              <Field
                name="country"
                label="Country"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="postalCode">Postal/Zip Code</label>
            <ValidatedInput property-name="postalCode">
              <Field
                name="postalCode"
                label="Postal/Zip Code"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
        </div>
        <Button
          type="submit"
          label="Save Profile"
          icon="pi pi-save"
          :disabled="isSubmitting"
        ></Button>
      </form>
    </template>
  </Card>
</template>

<script lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useForm, Field } from "vee-validate";
import { StudentService } from "../services/StudentService";
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
    Field,
    ValidatedInput
  },
  props: {
    edit: {
      type: Boolean,
      required: true
    }
  },
  setup(props: any) {
    // Readonly student data from state.
    const store = useStore();

    const router = useRouter();
    const readonlyProfile = computed(() => store.state.student.profile);
    const { handleSubmit, isSubmitting, setValues } = useForm<ProfileState>();
    onMounted(async () => {
      if (props.edit) {
        const contact = await StudentService.shared.getContact();
        setValues({ ...contact });
      }
    });

    const onSubmit = handleSubmit(async formValues => {
      const result = await StudentService.shared.createStudent({
        ...formValues
      });
      if (typeof result === "boolean" && result) {
        alert("Account created");
        setTimeout(() => {
          router.push({
            name: "Home"
          });
        }, 1000);
      } else {
        alert(`${result}`);
      }
    });

    return {
      readonlyProfile,
      onSubmit,
      isSubmitting
    };
  }
};
</script>

<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
