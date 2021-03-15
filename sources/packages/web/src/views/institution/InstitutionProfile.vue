<template>
  <Card class="p-m-4">
    <template #title>Institution Profile Setup</template>
    <template #content>
      <form>
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
            <InputText id="studentEmail" v-model="profileState.studentEmail" />
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
            <InputText
              id="operatingName"
              v-model="profileState.operatingName"
            />
          </div>
          <div class="p-field p-col-6">
            <label for="primaryPhoneNumber">Primary Phone Number</label>
            <InputText
              id="primaryPhoneNumber"
              v-model="profileState.primaryPhoneNumber"
            />
          </div>
          <div class="p-field p-col-6">
            <label for="primaryEmail">Primary Email</label>
            <InputText id="primaryEmail" v-model="profileState.primaryEmail" />
          </div>
          <div class="p-field p-col-12">
            <label for="institutionWebsite">Institution Website</label>
            <InputText
              id="institutionWebsite"
              v-model="profileState.institutionWebsite"
            />
          </div>
          <div class="p-field p-col-12">
            <label for="regulatingBody">Institution Regulating body</label>
            <InputText
              id="regulatingBody"
              v-model="profileState.regulatingBody"
            />
          </div>
          <div class="p-field p-col-6">
            <label for="estabilishdDate">Established Date</label>
            <InputText
              id="estabilishdDate"
              v-model="profileState.estabilishdDate"
            />
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
              <InputText
                id="primaryContactfirstName"
                v-model="profileState.primaryContact.firstName"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactLastName">Last Name</label>
              <InputText
                id="primaryContactLastName"
                v-model="profileState.primaryContact.lastName"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactEmail">Email</label>
              <InputText
                id="primaryContactEmail"
                v-model="profileState.primaryContact.email"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactPhoneNumber">Phone Number</label>
              <InputText
                id="primaryContactPhoneNumber"
                v-model="profileState.primaryContact.phoneNumber"
              />
            </div>
          </div>
        </ContentGroup>
        <ContentGroup class="p-px-4 p-mt-4">
          <h4>Legal Authorized Authorities Contact Information</h4>
          <p>If you would like to use</p>
          <div class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-6">
              <label for="primaryContactfirstName">First Name</label>
              <InputText
                id="primaryContactfirstName"
                v-model="profileState.legalContact.firstName"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactLastName">Last Name</label>
              <InputText
                id="primaryContactLastName"
                v-model="profileState.legalContact.lastName"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactEmail">Email</label>
              <InputText
                id="primaryContactEmail"
                v-model="profileState.legalContact.email"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryContactPhoneNumber">Phone Number</label>
              <InputText
                id="primaryContactPhoneNumber"
                v-model="profileState.legalContact.phoneNumber"
              />
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
              <InputText
                id="primaryAddressAddress1"
                v-model="profileState.primaryAddress.address1"
              />
            </div>
            <div class="p-field p-col-12">
              <label for="primaryAddressAddress2">Address 2</label>
              <InputText
                id="primaryAddressAddress2"
                v-model="profileState.primaryAddress.address2"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressCity">City</label>
              <InputText
                id="primaryAddressCity"
                v-model="profileState.primaryAddress.city"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressPostalCode">Postal/ZIP code</label>
              <InputText
                id="primaryAddressPostalCode"
                v-model="profileState.primaryAddress.postalCode"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressProvinceState">Province/State</label>
              <InputText
                id="primaryAddressProvinceState"
                v-model="profileState.primaryAddress.provinceState"
              />
            </div>
            <div class="p-field p-col-6">
              <label for="primaryAddressCountry">Country</label>
              <InputText
                id="primaryAddressCountry"
                v-model="profileState.primaryAddress.coutry"
              />
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
        <Button class="p-mt-4">Next</Button>
      </form>
    </template>
  </Card>
</template>

<script lang="ts">
import { onMounted, ref, reactive } from "vue";
import { UserService } from "../../services/UserService";
import HorizontalSeparator from "../../components/generic/HorizontalSeparator.vue";
import ContentGroup from "../../components/generic/ContentGroup.vue";

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
  },
  setup() {
    const readonlyProfileState = ref({} as ReadonlyProfileState);
    const profileState = reactive({
      primaryContact: {} as ContactInfo,
      legalContact: {} as ContactInfo,
      primaryAddress: {} as Address,
    } as ProfileState);
    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      readonlyProfileState.value = {
        userfirstName: bceidAccount.user.firstname,
        userLastName: bceidAccount.user.surname,
        institutionLegalName: bceidAccount.institution.legalName,
      };

      profileState.studentEmail = "Student email@test.com";
      profileState.operatingName = "Operating Name";
      profileState.primaryPhoneNumber = "123 456 7891";
      profileState.primaryEmail = "Primary Email@test.com";
      profileState.institutionWebsite = "Institution Website";
      profileState.regulatingBody = "Regulating Body";
      profileState.estabilishdDate = new Date();
      profileState.primaryContact = {
        firstName: "Primary First Name",
        lastName: "Primary Last Name",
        email: "Primary Email",
        phoneNumber: "Primary Phone Number",
      };
      profileState.legalContact = {
        firstName: "Legal First Name",
        lastName: "Legal Last Name",
        email: "Legal Email",
        phoneNumber: "Legal Phone Number",
      };
      profileState.primaryAddress = {
        address1: "Primary Address Address 1",
        address2: "Primary Address Address 2",
        city: "Primary Address City",
        postalCode: "Primary Address Postal Code",
        provinceState: "Primary Address Province State",
        coutry: "Primary Address Country",
      };
    });

    return {
      readonlyProfileState,
      profileState,
    };
  },
};
</script>

<style lang="scss" scoped>
input:read-only {
  background-color: #ddd;
}
</style>
