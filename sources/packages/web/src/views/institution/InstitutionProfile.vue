<template>
  <Card class="p-m-4">
    <template #title>Institution Profile Setup</template>
    <template #content>
      <form @submit="onSubmit" novalidate>
        <Message severity="info">
          Please notice that the read-only information below is retrieved from
          your BCeID account and it is not possible to change it here. If any
          read-only information needs to be changed please visit
          <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
        </Message>
        <h2>Let’s Complete Your Profile</h2>
        <h4>User Information</h4>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-6">
            <label for="firstName">First Name</label>
            <InputText
              id="firstName"
              v-model="readonlyProfileState.userfirstName"
              readonly
            />
          </div>
          <div class="p-field p-col-6">
            <label for="lastName">Last Name</label>
            <InputText
              id="lastName"
              v-model="readonlyProfileState.userLastName"
              readonly
            />
          </div>
          <div class="p-field p-col-6">
            <label for="studentEmail">Email</label>
            <ValidatedInput property-name="studentEmail">
              <Field
                name="studentEmail"
                label="Email"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
        </div>
        <h4>Institution Information</h4>
        <p>
          Please enter your institution information below. You will be able edit
          these details in your institution profile.
        </p>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-12">
            <label for="legalName">Legal Operating Name</label>
            <InputText
              id="legalName"
              v-model="readonlyProfileState.institutionLegalName"
              readonly
            />
          </div>
          <p>
            If you would like your institution name to be displayed to users of
            StudentAid BC please enter it below
          </p>
          <div class="p-field p-col-12">
            <label for="operatingName"
              >Institution Operating Name (Optional)</label
            >
            <ValidatedInput property-name="operatingName">
              <Field
                name="operatingName"
                label="Institution Operating Name"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="primaryPhoneNumber">Primary Phone Number</label>
            <ValidatedInput property-name="primaryPhoneNumber">
              <Field
                name="primaryPhoneNumber"
                label="Primary Phone Number"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="primaryEmail">Primary Email</label>
            <ValidatedInput property-name="primaryEmail">
              <Field
                name="primaryEmail"
                label="Primary Email"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-12">
            <label for="institutionWebsite">Institution Website</label>
            <ValidatedInput property-name="institutionWebsite">
              <Field
                name="institutionWebsite"
                label="Institution Website"
                rules="required"
                as="InputText"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-12">
            <label for="regulatingBody">Institution Regulating body</label>
            <ValidatedInput property-name="regulatingBody">
              <Dropdown
                v-model="regulatingBody"
                :options="regulatingBodyOptions"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="estabilishdDate">Established Date</label>
            <ValidatedInput property-name="estabilishdDate">
              <Calendar
                v-model="estabilishdDate"
                showIcon="true"
                dateFormat="dd/mm/yy"
              />
            </ValidatedInput>
          </div>
        </div>
        <HorizontalSeparator />
        <h4>Institution Primary Contact Information</h4>
        <p>Please enter the primary contacts for your institution</p>
        <ContentGroup class="p-px-4">
          <h4>Primary Contact Information</h4>
          <p>If you would like to use</p>
          <div class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-6">
              <label for="primaryContactfirstName">First Name</label>
              <ValidatedInput property-name="primaryContact.firstName">
                <Field
                  name="primaryContact.firstName"
                  label="First Name"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactLastName">Last Name</label>
              <ValidatedInput property-name="primaryContact.lastName">
                <Field
                  name="primaryContact.lastName"
                  label="Last Name"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactEmail">Email</label>
              <ValidatedInput property-name="primaryContact.email">
                <Field
                  name="primaryContact.email"
                  label="Email"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactPhoneNumber">Phone Number</label>
              <ValidatedInput property-name="primaryContact.phoneNumber">
                <Field
                  name="primaryContact.phoneNumber"
                  label="Phone Number"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
          </div>
        </ContentGroup>
        <ContentGroup class="p-px-4 p-mt-4">
          <h4>Legal Authorized Authorities Contact Information</h4>
          <p>If you would like to use</p>
          <div class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-6">
              <label for="primaryContactfirstName">First Name</label>
              <ValidatedInput property-name="legalContact.firstName">
                <Field
                  name="legalContact.firstName"
                  label="First Name"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactLastName">Last Name</label>
              <ValidatedInput property-name="legalContact.lastName">
                <Field
                  name="legalContact.lastName"
                  label="Last Name"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactEmail">Email</label>
              <ValidatedInput property-name="legalContact.email">
                <Field
                  name="legalContact.email"
                  label="Email"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactPhoneNumber">Phone Number</label>
              <ValidatedInput property-name="legalContact.phoneNumber">
                <Field
                  name="legalContact.phoneNumber"
                  label="Phone Number"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
          </div>
        </ContentGroup>
        <HorizontalSeparator />
        <h4>Institution Mailing Information</h4>
        <p>Please enter the mailing address for your institution</p>
        <ContentGroup class="p-px-4">
          <h4>Primary Institution Address</h4>
          <p>If you would like to use</p>
          <div class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12">
              <label for="primaryAddressAddress1">Address 1</label>
              <ValidatedInput property-name="primaryAddress.address1">
                <Field
                  name="primaryAddress.address1"
                  label="Address 1"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-12">
              <label for="primaryAddressAddress2">Address 2</label>
              <ValidatedInput property-name="primaryAddress.address2">
                <Field
                  name="primaryAddress.address2"
                  label="Address 2"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressCity">City</label>
              <ValidatedInput property-name="primaryAddress.city">
                <Field
                  name="primaryAddress.city"
                  label="City"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressPostalCode">Postal/ZIP code</label>
              <ValidatedInput property-name="primaryAddress.postalCode">
                <Field
                  name="primaryAddress.postalCode"
                  label="Postal/ZIP code"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressProvinceState">Province/State</label>
              <ValidatedInput property-name="primaryAddress.provinceState">
                <Field
                  name="primaryAddress.provinceState"
                  label="Province/State"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressCountry">Country</label>
              <ValidatedInput property-name="primaryAddress.coutry">
                <Field
                  name="primaryAddress.coutry"
                  label="Country"
                  rules="required"
                  as="InputText"
                />
              </ValidatedInput>
            </div>
          </div>
        </ContentGroup>
        <HorizontalSeparator />
        <h4>Privacy Disclaimer</h4>
        <p>
          Be continuing into the StudentAidBC Application you agree to
          StudentAid BC’s Privacy policy.
        </p>
        <HorizontalSeparator />
        <Button
          type="submit"
          label="Next"
          icon="pi pi-save"
          class="p-mt-4"
          :disabled="isSubmitting"
        ></Button>
      </form>
    </template>
  </Card>
</template>

<script lang="ts">
import { onMounted, ref, reactive } from "vue";
import { UserService } from "../../services/UserService";
import HorizontalSeparator from "../../components/generic/HorizontalSeparator.vue";
import ContentGroup from "../../components/generic/ContentGroup.vue";
import { useForm, Field, useField } from "vee-validate";
import ValidatedInput from "../../components/generic/ValidatedInput.vue";
import * as yup from "yup";

interface ReadonlyProfileState {
  userfirstName: string;
  userLastName: string;
  institutionLegalName: string;
}

interface ProfileState {
  studentEmail: string;
  operatingName: string;
  primaryPhoneNumber: string;
  primaryEmail: string;
  institutionWebsite: string;
  regulatingBody: string;
  estabilishdDate: Date;
  primaryContact: ContactInfo;
  legalContact: ContactInfo;
  primaryAddress: Address;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Address {
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  provinceState: string;
  coutry: string;
}

export default {
  components: {
    HorizontalSeparator,
    ContentGroup,
    ValidatedInput,
    Field,
  },
  setup() {
    const readonlyProfileState = ref({} as ReadonlyProfileState);
    const profileState = reactive({
      primaryContact: {} as ContactInfo,
      legalContact: {} as ContactInfo,
      primaryAddress: {} as Address,
    } as ProfileState);

    const { handleSubmit, isSubmitting, setValues } = useForm<ProfileState>();

    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      readonlyProfileState.value = {
        userfirstName: bceidAccount.user.firstname,
        userLastName: bceidAccount.user.surname,
        institutionLegalName: bceidAccount.institution.legalName,
      };
    });

    const onSubmit = handleSubmit(async formValues => {
      console.dir(formValues);
    });

    const today = new Date();
    const { value: estabilishdDate } = useField(
      "estabilishdDate",
      yup
        .date()
        .required("Established Date is required.")
        .max(today, "Established Date should be today or a date in the past.")
        .typeError(
          "Established Date is not in the correct format DD/MM/YYYY or it is an invalid date.",
        ),
      { label: "Established Date" },
    );

    const { value: regulatingBody } = useField(
      "regulatingBody",
      yup.string().required(),
      { label: "Regulating Body" },
    );

    const regulatingBodyOptions = [
      "Private Act of BC Legislature",
      "ICBC",
      "DQAB",
      "PTIB",
      "ITA",
    ];

    return {
      readonlyProfileState,
      onSubmit,
      isSubmitting,
      profileState,
      estabilishdDate,
      regulatingBody,
      regulatingBodyOptions,
      today,
    };
  },
};
</script>

<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
