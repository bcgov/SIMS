import BaseMethods from "./BaseMethods";

export default class InstitutionProfileObject extends BaseMethods {
  manageProfileButton() {
    return cy.contains("Manage Profile");
  }

  institutionProfileInformationText() {
    return cy.contains("Your institution profile");
  }

  legalOperatingNameInputText() {
    return this.getElementByCyId("legalOperatingName");
  }

  operatingName() {
    return this.getElementByCyId("operatingName");
  }

  institutionType() {
    return this.getElementByCyId("institutionType");
  }

  institutionRegulatingBody() {
    return this.getElementByCyId("regulatingBody").parent();
  }

  institutionEstablishedDate() {
    return this.getElementByCyId("establishedDate");
  }

  primaryEmailInputText() {
    return this.getElementByCyId("primaryContactEmail");
  }

  submitButton() {
    return this.getElementByCyId("submit");
  }

  unexpectedErrorMessage() {
    return cy.contains("Unexpected error");
  }

  primaryPhoneNumberInputText() {
    return this.getElementByCyId("primaryPhone");
  }

  institutionWebsiteInputText() {
    return this.getElementByCyId("website");
  }

  institutionRegulationBodyDropdown() {
    return cy.get(".form-control.ui");
  }

  institutionRegulationBodyDropdownInputType() {
    return cy.get(".choices__input");
  }

  establishedDate() {
    return cy.get(".input");
  }

  firstNameInstitutionInputText() {
    return this.getElementByCyId("primaryContactFirstName");
  }

  lastNameInstitutionInputText() {
    return this.getElementByCyId("primaryContactLastName");
  }

  emailInstitutionInputText() {
    return this.getElementByCyId("primaryContactEmail");
  }

  phoneNumberInstitutionInputText() {
    return this.getElementByCyId("primaryContactPhone");
  }

  firstNameAuthorizedInputText() {
    return this.getElementByCyId("primaryContactFirstName");
  }

  lastNameAuthorizedInputText() {
    return this.getElementByCyId("primaryContactLastName");
  }

  emailAuthorizedInputText() {
    return this.getElementByCyId("primaryContactEmail");
  }

  phoneNumberAuthorizedInputText() {
    return this.getElementByCyId("primaryContactPhone");
  }

  addressInstitutionInputText() {
    return this.getElementByCyId("addressLine1");
  }

  cityInputText() {
    return this.getElementByCyId("city");
  }

  postalInputText() {
    return this.getElementByCyId("canadaPostalCode");
  }

  countryInput() {
    return this.getElementByCyId("selectedCountry");
  }

  countryInputText() {
    return this.getElementByCyId("selectedCountry").parent();
  }

  countrySearchInputText(country: string) {
    return cy
      .get("[role='textbox']")
      .eq(1)
      .clear()
      .type(country, { force: true });
  }

  countryDropdownMenu() {
    return this.getElementByCyId("selectedCountry").parent().parent();
  }

  provinceInputText() {
    return this.getElementByCyId("provinceState").parent();
  }

  provinceSearchInputText(province: string) {
    return cy
      .get("[role='textbox']")
      .eq(2)
      .clear()
      .type(province, { force: true });
  }

  provinceDropdownMenu() {
    return this.getElementByCyId("provinceState").parent().parent();
  }

  otherCountryInputText() {
    return this.getElementByCyId("otherCountry");
  }

  address1IsRequiredErrorMessage() {
    return cy.contains("Address line 1 is required");
  }

  countryIsRequiredErrorMessage() {
    return cy.contains("Country is required");
  }

  cityIsRequiredErrorMessage() {
    return cy.contains("City is required");
  }
}
