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
                optionLabel="name"
                optionValue="value"
              />
            </ValidatedInput>
          </div>
          <div class="p-field p-col-6">
            <label for="estabilishdDate">Established Date</label>
            <ValidatedInput property-name="establishedDate">
              <Calendar
                v-model="establishedDate"
                :showIcon="true"
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
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { UserService } from "../../services/UserService";
import { useForm, Field, useField } from "vee-validate";
import { useToast } from "primevue/usetoast";
import * as yup from "yup";
import { InstitutionProfileState } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import ValidatedInput from "../../components/generic/ValidatedInput.vue";
import HorizontalSeparator from "../../components/generic/HorizontalSeparator.vue";
import ContentGroup from "../../components/generic/ContentGroup.vue";

// These options are temporarily hardcoded here as per team decision.
// These should be moved to or shared between API/web layer.
const regulatingBodyOptions = [
  { name: "Private Act of BC Legislature", value: "private-act" },
  { name: "ICBC", value: "icbc" },
  { name: "DQAB", value: "dqab" },
  { name: "PTIB", value: "ptib" },
  { name: "ITA", value: "ita" },
];

interface ReadonlyProfileState {
  userfirstName?: string;
  userLastName?: string;
  institutionLegalName?: string;
}

export default {
  components: {
    HorizontalSeparator,
    ContentGroup,
    ValidatedInput,
    Field,
  },
  setup() {
    const toast = useToast();
    const router = useRouter();

    const readonlyProfileState = ref({} as ReadonlyProfileState);
    const { handleSubmit, isSubmitting, setValues } = useForm<
      InstitutionProfileState
    >();

    const today = new Date();
    // establishedDate is using a Calendar UI component that works properly
    // only with v-model, that why it has a different setup.
    const { value: establishedDate } = useField(
      "establishedDate",
      yup
        .date()
        .required("Established Date is required.")
        .max(today, "Established Date should be today or a date in the past.")
        .typeError(
          "Established Date is not in the correct format DD/MM/YYYY or it is an invalid date.",
        ),
    );
    // regulatingBody is using a Calendar UI component that works properly
    // only with v-model, that why it has a different setup.
    const { value: regulatingBody } = useField(
      "regulatingBody",
      yup.string().required("Regulating Body is required."),
    );

    onMounted(async () => {
      // Load read-only information from BCeID.
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      readonlyProfileState.value = {
        userfirstName: bceidAccount?.user.firstname,
        userLastName: bceidAccount?.user.surname,
        institutionLegalName: bceidAccount?.institution.legalName,
      };

      setValues({
        // This should be pre-populated only during user creation.
        studentEmail: bceidAccount?.user.email,
      });
    });

    const onSubmit = handleSubmit(async formValues => {
      try {
        await InstitutionService.shared.createInstitution(formValues);
        toast.add({
          severity: "success",
          summary: "Created!",
          detail: "Institution and User successfully created!",
          life: 5000,
        });
        router.push({ name: InstitutionRoutesConst.INSTITUTION_DASHBOARD });
      } catch (error) {
        console.log(error);
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the creation process.",
          life: 5000,
        });
      }
    });

    return {
      readonlyProfileState,
      onSubmit,
      isSubmitting,
      establishedDate,
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
